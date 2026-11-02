import { CATEGORY_LABELS, type Place } from '../lib/api/overpass'
import { imageCreditUrl, loadPlaceSummary, sizedImageUrl } from '../lib/api/wikipedia'
import { CATEGORY_ICONS } from '../lib/places'
import { useAsync } from '../lib/useAsync'

/** 장소 사진: 위키 문서가 연결된 장소만 위키미디어 사진(고화질), 없으면 종류 아이콘 */
export function PlacePhoto({ place, className, width = 500, credit = false }: { place: Place; className: string; width?: 500 | 960 | 1280; credit?: boolean }) {
  const summary = useAsync(place.wikipedia ? `place:${place.wikipedia}` : null, () => loadPlaceSummary(place.wikipedia ?? ''))
  const data = summary.status === 'done' ? summary.data : null
  const image = data ? sizedImageUrl(data, width) : undefined
  const creditUrl = credit && data ? imageCreditUrl(data) : undefined
  return image ? (
    <span className={className} style={{ background: `center / cover no-repeat url("${image}")` }}>
      {creditUrl && (
        <a className="photo-credit" href={creditUrl} target="_blank" rel="noreferrer">
          ⓒ 위키미디어
        </a>
      )}
    </span>
  ) : (
    <span className={`${className} placeholder`} aria-hidden>
      {CATEGORY_ICONS[place.category]}
    </span>
  )
}

interface Props {
  place: Place
  saved?: boolean
  onOpen: (place: Place) => void
}

export function PlaceCard({ place, saved = false, onOpen }: Props) {
  return (
    <button type="button" className="place-card" aria-label={place.name} onClick={() => onOpen(place)}>
      <span className="place-photo-wrap">
        <PlacePhoto place={place} className="place-photo" />
        {saved && (
          <span className="saved-heart" aria-label="저장함">
            ♥
          </span>
        )}
      </span>
      <span className="place-name">
        <span className="accent">[{CATEGORY_LABELS[place.category]}]</span>
        {place.name}
      </span>
      <span className="muted">{place.distanceKm}km</span>
    </button>
  )
}
