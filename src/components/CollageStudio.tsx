import { useEffect, useRef, useState } from 'react'
import { maxPhotos, TEMPLATES, toggleSelection, type CollageTemplate } from '../lib/collage'
import { BACKGROUNDS, canvasToBlob, downloadBlob, drawCollage } from '../lib/collageRender'
import { dayLabel, groupByDay, photoEntries } from '../lib/journal'
import { indexedDbPhotos } from '../lib/photoStore'
import { useAsync } from '../lib/useAsync'
import type { JournalEntry, Trip } from '../types'
import { AsyncView } from './AsyncView'
import { PhotoView } from './PhotoView'

const DEFAULT_BACKGROUND: Record<CollageTemplate, string> = {
  grid: '#ffffff',
  polaroid: '#f6f1e9',
  film: '#eef0fd',
  magazine: '#ffffff',
}

function Editor({ trip, entries, defaultSubtitle }: { trip: Trip; entries: JournalEntry[]; defaultSubtitle: string }) {
  const [template, setTemplate] = useState<CollageTemplate>('polaroid')
  const [order, setOrder] = useState<string[]>(() => entries.slice(0, maxPhotos('polaroid')).map((e) => e.id))
  const [title, setTitle] = useState(`${trip.city.name} 여행`)
  const [subtitle, setSubtitle] = useState(defaultSubtitle)
  const [background, setBackground] = useState(DEFAULT_BACKGROUND.polaroid)
  const [showCaptions, setShowCaptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const max = maxPhotos(template)

  // 고른 기록의 사진을 한 번에 불러 둔다 (다시 그릴 때마다 읽지 않도록)
  const bitmaps = useAsync(`bitmaps:${entries.map((e) => e.id).join(',')}`, async () => {
    const map = new Map<string, ImageBitmap>()
    for (const e of entries) {
      const blob = e.photoId ? await indexedDbPhotos.get(e.photoId) : undefined
      if (blob) map.set(e.id, await createImageBitmap(blob))
    }
    return map
  })

  const chosen = order.slice(0, max)
  useEffect(() => {
    if (bitmaps.status !== 'done' || !canvas.current) return
    const photos = chosen
      .map((id) => ({ bitmap: bitmaps.data.get(id), caption: entries.find((e) => e.id === id)?.caption ?? '' }))
      .filter((p): p is { bitmap: ImageBitmap; caption: string } => !!p.bitmap)
    if (photos.length > 0) drawCollage(canvas.current, { template, title, subtitle, background, showCaptions, photos })
  })

  async function save() {
    if (!canvas.current) return
    setSaving(true)
    try {
      downloadBlob(await canvasToBlob(canvas.current), `${trip.city.name}-여행-콜라주.jpg`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="studio">
      <div className="studio-preview">
        <AsyncView state={bitmaps} loading="사진을 불러오는 중이에요.">
          {() => (chosen.length > 0 ? <canvas ref={canvas} className="collage-canvas" aria-label="콜라주 미리 보기" /> : <p className="muted">사진을 1장 이상 골라 주세요.</p>)}
        </AsyncView>
      </div>

      <div className="studio-controls">
        <div className="control">
          <span className="control-label">템플릿</span>
          <div className="segmented wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={template === t.id ? 'active' : ''}
                aria-pressed={template === t.id}
                onClick={() => {
                  setTemplate(t.id)
                  setBackground(DEFAULT_BACKGROUND[t.id])
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="control">
          <span className="control-label">
            사진 고르기 <span className="muted">(누른 순서대로, 최대 {max}장 · {Math.min(order.length, max)}장 골라짐)</span>
          </span>
          <ul className="pick-grid">
            {entries.map((e) => {
              const n = order.indexOf(e.id)
              return (
                <li key={e.id}>
                  <button type="button" className={n >= 0 && n < max ? 'pick on' : 'pick'} aria-pressed={n >= 0} onClick={() => setOrder((o) => toggleSelection(o, e.id, max))}>
                    {e.photoId && <PhotoView photoId={e.photoId} className="pick-photo" alt={e.caption} />}
                    {n >= 0 && <span className="pick-no">{n + 1}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
          {order.length > max && <p className="hint">이 템플릿은 {max}장까지라 앞의 {max}장만 들어가요.</p>}
        </div>

        <label className="control">
          <span className="control-label">제목</span>
          <input value={title} maxLength={30} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="control">
          <span className="control-label">부제목</span>
          <input value={subtitle} maxLength={40} onChange={(e) => setSubtitle(e.target.value)} />
        </label>

        <div className="control">
          <span className="control-label">배경색</span>
          <div className="swatches">
            {BACKGROUNDS.map((c) => (
              <button
                key={c}
                type="button"
                className={background === c ? 'swatch on' : 'swatch'}
                style={{ background: c }}
                aria-label={`배경색 ${c}`}
                aria-pressed={background === c}
                onClick={() => setBackground(c)}
              />
            ))}
          </div>
        </div>

        <label className="inline">
          <input type="checkbox" checked={showCaptions} onChange={(e) => setShowCaptions(e.target.checked)} />
          사진에 멘트 넣기
        </label>

        <button type="button" className="primary" onClick={save} disabled={saving || chosen.length === 0}>
          {saving ? '저장하는 중…' : '이미지 저장'}
        </button>
      </div>
    </div>
  )
}

/** 콜라주 꾸미기: 범위(전체·하루) → 템플릿·사진·제목·배경색 고르기 → 미리 보기 → 저장 (TODO 8-3, 10-2) */
export function CollageStudio({ trip }: { trip: Trip }) {
  const days = groupByDay(trip).filter((d) => d.entries.some((e) => e.photoId))
  const [day, setDay] = useState('')
  if (days.length === 0) return <p className="muted">사진이 있는 기록이 생기면 콜라주를 만들 수 있어요.</p>
  const entries = photoEntries(trip, day || undefined)
  const subtitle = day ? `${dayLabel(trip, day)} · ${day}` : `${trip.departDate} ~ ${trip.returnDate}`
  return (
    <>
      <label className="control">
        <span className="control-label">범위</span>
        <select value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">여행 전체 ({photoEntries(trip).length}장)</option>
          {days.map((d) => (
            <option key={d.date} value={d.date}>
              {d.label} ({d.date})
            </option>
          ))}
        </select>
      </label>
      <Editor key={day} trip={trip} entries={entries} defaultSubtitle={subtitle} />
    </>
  )
}
