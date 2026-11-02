import { progress } from '../lib/checklist'
import { href } from '../lib/router'
import { savedPlaces } from '../lib/saved'
import { dDayLabel } from '../lib/trips'
import type { Trip } from '../types'
import { CityPhoto } from './CityPhoto'

/** 내 여행 한 줄 (사진·도시·날짜·D-day·준비율) */
export function TripRow({ trip, today }: { trip: Trip; today: string }) {
  return (
    <li>
      <a className="trip-row" href={href({ page: 'trip', tripId: trip.id, tab: 'overview' })}>
        <CityPhoto city={trip.city} className="trip-thumb" />
        <span className="trip-row-main">
          <span className="trip-row-title">
            {trip.city.country && <span className="accent">[{trip.city.country}]</span>}
            {trip.city.name}
          </span>
          <span className="muted">
            {trip.departDate} ~ {trip.returnDate} · {trip.travelers}명
          </span>
          <span className="muted">
            준비 {progress(trip.checklist)}% · 가고 싶은 곳 {savedPlaces(trip).length}곳
          </span>
        </span>
        <span className="badge">{dDayLabel(today, trip)}</span>
      </a>
    </li>
  )
}
