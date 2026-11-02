import { useRef, useState, type FormEvent } from 'react'
import { downloadBlob } from '../lib/collageRender'
import { resizePhoto } from '../lib/image'
import { addEntry, dayLabel, defaultEntryDate, groupByDay, journalOf, removeEntry, SLOT_NAMES, SLOTS, validateEntry } from '../lib/journal'
import { exportJournal, importJournal } from '../lib/journalBackup'
import { indexedDbPhotos } from '../lib/photoStore'
import { savedPlaces } from '../lib/saved'
import type { JournalEntry, JournalSlot, Trip } from '../types'
import { CollageStudio } from './CollageStudio'
import { PhotoView } from './PhotoView'

interface Props {
  trip: Trip
  today: string
  onUpdate: (trip: Trip) => void
}

function EntryForm({ trip, today, onAdd }: { trip: Trip; today: string; onAdd: (entry: JournalEntry) => void }) {
  const [date, setDate] = useState(defaultEntryDate(trip, today))
  const [slot, setSlot] = useState<JournalSlot>('lunch')
  const [caption, setCaption] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  function pickFile(f: File | null) {
    setFile(f)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const id = crypto.randomUUID()
    const photoId = file ? `photo-${id}` : undefined
    const entry: JournalEntry = { id, date, slot, caption, photoId, placeName: placeName || undefined, createdAt: new Date().toISOString() }
    const found = validateEntry(entry)
    setErrors(found)
    if (found.length > 0) return
    setSaving(true)
    try {
      if (file && photoId) await indexedDbPhotos.put(photoId, await resizePhoto(file))
      onAdd(entry)
      setCaption('')
      setPlaceName('')
      pickFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch {
      setErrors(['사진을 저장하지 못했어요. 다른 사진으로 다시 시도해 주세요.'])
    } finally {
      setSaving(false)
    }
  }

  const places = savedPlaces(trip)
  return (
    <form className="card form journal-form" onSubmit={handleSubmit}>
      <h3>지금 기록 남기기</h3>
      <div className="row">
        <label>
          날짜 <span className="muted">({dayLabel(trip, date)})</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          때
          <select value={slot} onChange={(e) => setSlot(e.target.value as JournalSlot)}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {SLOT_NAMES[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="photo-pick">
        {preview ? <img src={preview} alt="올릴 사진 미리 보기" /> : <span>📷 사진 고르기 (선택)</span>}
        <input ref={fileInput} type="file" accept="image/*" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
      </label>
      <label>
        한 줄 멘트
        <input value={caption} maxLength={200} placeholder="예: 도톤보리에서 먹은 오코노미야키!" onChange={(e) => setCaption(e.target.value)} />
      </label>
      {places.length > 0 && (
        <label>
          장소 (선택)
          <select value={placeName} onChange={(e) => setPlaceName(e.target.value)}>
            <option value="">고르지 않음</option>
            {places.map((s) => (
              <option key={s.place.id} value={s.place.name}>
                {s.place.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {errors.length > 0 && (
        <ul className="errors" role="alert">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
      <button type="submit" className="primary" disabled={saving}>
        {saving ? '사진 저장 중…' : '기록 남기기'}
      </button>
    </form>
  )
}

/** 여행 "기록" 탭: 사진·멘트 남기기, 일차별 타임라인, 콜라주, 내보내기/불러오기 (TODO 8-1~8-3) */
export function JournalTab({ trip, today, onUpdate }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const days = groupByDay(trip)

  async function handleExport() {
    const text = await exportJournal(trip, indexedDbPhotos)
    downloadBlob(new Blob([text], { type: 'application/json' }), `${trip.city.name}-여행-기록.json`)
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      const { trip: next, added } = await importJournal(trip, await file.text(), indexedDbPhotos)
      onUpdate(next)
      setMessage(`기록 ${added}개를 불러왔어요.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '불러오지 못했어요.')
    } finally {
      if (importInput.current) importInput.current.value = ''
    }
  }

  async function handleRemove(entry: JournalEntry) {
    if (!confirm('이 기록을 지울까요?')) return
    if (entry.photoId) await indexedDbPhotos.delete(entry.photoId).catch(() => {})
    onUpdate(removeEntry(trip, entry.id))
  }

  return (
    <>
      <EntryForm trip={trip} today={today} onAdd={(entry) => onUpdate(addEntry(trip, entry))} />

      {days.length === 0 ? (
        <p className="muted empty-journal">아직 기록이 없어요. 여행 중에 사진 한 장과 한 줄을 남겨 보세요.</p>
      ) : (
        days.map((d) => (
          <section key={d.date} className="journal-day">
            <h3>
              {d.label} <span className="muted">{d.date}</span>
            </h3>
            <ul className="journal-list">
              {d.entries.map((e) => (
                <li key={e.id} className="journal-entry">
                  {e.photoId && <PhotoView photoId={e.photoId} className="journal-photo" alt={e.caption || SLOT_NAMES[e.slot]} />}
                  <div className="journal-text">
                    <span className="tag">{SLOT_NAMES[e.slot]}</span>
                    {e.placeName && <span className="muted"> 📍 {e.placeName}</span>}
                    {e.caption && <p>{e.caption}</p>}
                  </div>
                  <button type="button" className="text-button" onClick={() => handleRemove(e)}>
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <section className="card">
        <h3>콜라주 꾸미기</h3>
        <CollageStudio trip={trip} />
      </section>

      <section className="card">
        <h3>기록 옮기기</h3>
        <p className="muted">사진은 이 기기 브라우저에만 저장돼요. 기기를 바꾸기 전에 파일로 내보내 두세요.</p>
        <div className="link-row">
          <button type="button" className="secondary" onClick={handleExport} disabled={journalOf(trip).length === 0}>
            기록 내보내기
          </button>
          <label className="secondary file-button">
            불러오기
            <input ref={importInput} type="file" accept="application/json,.json" onChange={(e) => handleImport(e.target.files?.[0])} />
          </label>
        </div>
        {message && (
          <p className="muted" role="status">
            {message}
          </p>
        )}
      </section>
    </>
  )
}
