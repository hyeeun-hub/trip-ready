import { useState } from 'react'
import { allPhotos, groupByDay, SLOT_NAMES, tripsWithJournal } from '../lib/journal'
import { href } from '../lib/router'
import type { Trip } from '../types'
import { CollageStudio } from './CollageStudio'
import { PhotoView } from './PhotoView'

/** 여행 기록 페이지: 모든 여행의 기록을 앨범·타임라인으로, 여행 하나를 고르면 콜라주 꾸미기 (TODO 10-1) */
export function JournalPage({ trips }: { trips: Trip[] }) {
  const withJournal = tripsWithJournal(trips)
  const [tripId, setTripId] = useState('')
  const [view, setView] = useState<'album' | 'timeline'>('album')
  const shown = tripId ? withJournal.filter((t) => t.id === tripId) : withJournal
  const photos = allPhotos(shown)
  const selected = withJournal.find((t) => t.id === tripId)

  if (withJournal.length === 0) {
    return (
      <div className="container">
        <h1 className="page-title">여행 기록</h1>
        <div className="card empty">
          <h3>아직 남긴 기록이 없어요</h3>
          <p className="muted">
            <a href={href({ page: 'trips' })}>내 여행</a>에서 여행을 열고 "여행 기록" 탭에서 사진 한 장과 한 줄을 남겨 보세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="section-head">
        <h1 className="page-title">여행 기록</h1>
        <div className="segmented small" role="tablist">
          {(['album', 'timeline'] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
              {v === 'album' ? '앨범' : '타임라인'}
            </button>
          ))}
        </div>
      </div>

      <div className="hashtags" role="group" aria-label="여행">
        {[{ id: '', label: '전체' }, ...withJournal.map((t) => ({ id: t.id, label: `${t.city.name} ${t.departDate.slice(0, 7)}` }))].map((c) => (
          <button key={c.id} type="button" className={tripId === c.id ? 'hashtag active' : 'hashtag'} aria-pressed={tripId === c.id} onClick={() => setTripId(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {view === 'album' ? (
        photos.length === 0 ? (
          <p className="muted">사진이 있는 기록이 없어요. 타임라인에서 글 기록을 볼 수 있어요.</p>
        ) : (
          <ul className="album-grid">
            {photos.map(({ trip, entry, dayLabel }) => (
              <li key={entry.id}>
                <a className="album-tile" href={href({ page: 'trip', tripId: trip.id, tab: 'journal' })}>
                  <PhotoView photoId={entry.photoId!} className="album-photo" alt={entry.caption || trip.city.name} />
                  <span className="album-caption">
                    <strong>
                      {trip.city.name} · {dayLabel} {SLOT_NAMES[entry.slot]}
                    </strong>
                    {entry.caption && <span>{entry.caption}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )
      ) : (
        shown.map((trip) => (
          <section key={trip.id} className="card journal-trip">
            <div className="card-head">
              <h3>
                {trip.city.name} 여행 <span className="muted">{trip.departDate} ~ {trip.returnDate}</span>
              </h3>
              <a className="more-link" href={href({ page: 'trip', tripId: trip.id, tab: 'journal' })}>
                기록하기 ›
              </a>
            </div>
            {groupByDay(trip).map((d) => (
              <div key={d.date} className="journal-day">
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
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}

      <section className="card">
        <h3>콜라주 꾸미기</h3>
        {selected ? <CollageStudio key={selected.id} trip={selected} /> : <p className="muted">위에서 여행을 하나 고르면 그 여행 사진으로 콜라주를 꾸밀 수 있어요.</p>}
      </section>
    </div>
  )
}
