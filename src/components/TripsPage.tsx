import { href } from '../lib/router'
import { splitTrips } from '../lib/trips'
import type { Trip } from '../types'
import { TripRow } from './TripRow'

/** 내 여행: 다가오는 여행 / 다녀온 여행 */
export function TripsPage({ trips, today }: { trips: Trip[]; today: string }) {
  const { upcoming, past } = splitTrips(trips, today)
  return (
    <div className="container">
      <div className="section-head">
        <h1 className="page-title">내 여행</h1>
        <a className="pill-button" href={href({ page: 'new' })}>
          + 새 여행
        </a>
      </div>
      {trips.length === 0 && (
        <div className="card empty">
          <h3>아직 만든 여행이 없어요</h3>
          <p className="muted">
            <a href={href({ page: 'explore' })}>여행지</a>에서 도시를 고르고 "이 도시로 여행 만들기"를 눌러 보세요.
          </p>
        </div>
      )}
      {upcoming.length > 0 && (
        <section className="section">
          <h2 className="section-title">다가오는 여행</h2>
          <ul className="trip-list">
            {upcoming.map((t) => (
              <TripRow key={t.id} trip={t} today={today} />
            ))}
          </ul>
        </section>
      )}
      {past.length > 0 && (
        <section className="section">
          <h2 className="section-title">다녀온 여행</h2>
          <ul className="trip-list">
            {past.map((t) => (
              <TripRow key={t.id} trip={t} today={today} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
