import { CATEGORY_LABELS, type Place } from '../lib/api/overpass'
import { loadPlaceSummary } from '../lib/api/wikipedia'
import { CATEGORY_ICONS } from '../lib/places'
import { useAsync } from '../lib/useAsync'

/** 장소 사진: 위키 문서가 연결된 장소만 위키미디어 사진, 없으면 종류 아이콘 */
export function PlacePhoto({ place, className }: { place: Place; className: string }) {
  const summary = useAsync(place.wikipedia ? `place:${place.wikipedia}` : null, () => loadPlaceSummary(place.wikipedia ?? ''))
  const image = summary.status === 'done' ? summary.data?.imageUrl : undefined
  return image ? (
    <span className={className} style={{ background: `center / cover no-repeat url("${image}")` }} />
  ) : (
    <span className={`${className} placeholder`} aria-hidden>
      {CATEGORY_ICONS[place.category]}
    </span>
  )
}

interface Props {
  place: Place
  onOpen: (place: Place) => void
}

export function PlaceCard({ place, onOpen }: Props) {
  return (
    <button type="button" className="place-card" aria-label={place.name} onClick={() => onOpen(place)}>
      <PlacePhoto place={place} className="place-photo" />
      <span className="place-name">
        <span className="accent">[{CATEGORY_LABELS[place.category]}]</span>
        {place.name}
      </span>
      <span className="muted">{place.distanceKm}km</span>
    </button>
  )
}
