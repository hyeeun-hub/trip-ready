import { useState } from 'react'
import { CATEGORY_LABELS, type Place } from '../lib/api/overpass'
import { savedPlaces, sortSaved, unsavePlace, updateSaved, visitDateError } from '../lib/saved'
import type { SavedPlace, Trip } from '../types'
import { PlacePhoto } from './PlaceCard'

interface Props {
  trip: Trip
  onUpdate: (trip: Trip) => void
  onOpenPlace: (place: Place) => void
}

function SavedRow({ trip, item, onUpdate, onOpenPlace }: { trip: Trip; item: SavedPlace } & Omit<Props, 'trip'>) {
  const [error, setError] = useState<string | null>(null)
  const { place } = item
  return (
    <li className="saved-row">
      <button type="button" className="saved-main" onClick={() => onOpenPlace(place)}>
        <PlacePhoto place={place} className="saved-photo" />
        <span className="saved-text">
          <span className="place-name">
            <span className="accent">[{CATEGORY_LABELS[place.category]}]</span>
            {place.name}
          </span>
          <span className="muted">{place.distanceKm}km</span>
        </span>
      </button>
      <div className="saved-fields">
        <input
          type="date"
          aria-label={`${place.name} 방문 예정일`}
          value={item.visitDate ?? ''}
          min={trip.departDate}
          max={trip.returnDate}
          onChange={(e) => {
            const found = visitDateError(trip, e.target.value)
            setError(found)
            if (!found) onUpdate(updateSaved(trip, place.id, { visitDate: e.target.value }))
          }}
        />
        <input
          aria-label={`${place.name} 메모`}
          placeholder="메모"
          defaultValue={item.memo}
          onBlur={(e) => e.target.value.trim() !== item.memo && onUpdate(updateSaved(trip, place.id, { memo: e.target.value }))}
        />
        <button type="button" className="text-button" onClick={() => onUpdate(unsavePlace(trip, place.id))}>
          해제
        </button>
      </div>
      {error && (
        <p className="errors" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}

/** 여행 화면의 "저장한 곳" 모아보기 (TODO 3-2) */
export function SavedPlaces({ trip, onUpdate, onOpenPlace }: Props) {
  const list = sortSaved(savedPlaces(trip))
  return (
    <section className="card">
      <div className="card-head">
        <h3>가고 싶은 곳</h3>
        <span className="badge">{list.length}곳</span>
      </div>
      {list.length === 0 ? (
        <p className="muted">아직 저장한 곳이 없어요. 둘러보기 탭에서 장소를 열고 ♡를 눌러 보세요.</p>
      ) : (
        <ul className="saved-list">
          {list.map((item) => (
            <SavedRow key={item.place.id} trip={trip} item={item} onUpdate={onUpdate} onOpenPlace={onOpenPlace} />
          ))}
        </ul>
      )}
    </section>
  )
}
