import { CATEGORY_LABELS, type Place } from '../lib/api/overpass'
import { loadPlaceSummary } from '../lib/api/wikipedia'
import { cuisineLabel, mapLinks, placeTagline } from '../lib/places'
import { isSaved, savePlace, tripsForCity, unsavePlace } from '../lib/saved'
import { useAsync } from '../lib/useAsync'
import type { City, Trip } from '../types'
import { BackLink } from './BackLink'
import { PlacePhoto } from './PlaceCard'

interface Props {
  place: Place
  city: City
  trips: Trip[]
  onUpdateTrip: (trip: Trip) => void
}

/** 장소 상세: 사진·이름·주소·거리·정보 태그·설명 (TODO 2-7) */
export function PlaceDetail({ place, city, trips, onUpdateTrip }: Props) {
  const targets = tripsForCity(trips, city)
  const wiki = useAsync(place.wikipedia ? `place:${place.wikipedia}` : null, () => loadPlaceSummary(place.wikipedia ?? ''))
  const summary = wiki.status === 'done' ? wiki.data : null
  const readable = summary && (summary.lang === 'ko' || summary.lang === 'en')
  const label = CATEGORY_LABELS[place.category]
  const tags = [label, ...place.cuisine.map(cuisineLabel), place.openingHours && '영업시간 정보', place.website && '웹사이트'].filter(Boolean)

  return (
    <div className="container narrow">
      <BackLink />
      <PlacePhoto place={place} className="detail-photo place-hero" />
      <div>
        <h2 className="detail-title">{place.name}</h2>
        {place.localName && <p className="muted">{place.localName}</p>}
        <p className="address">
          {place.address ?? '주소 정보 없음'} <span className="badge">{place.distanceKm}km</span>
        </p>
        <p className="quote">"{placeTagline(place, city.name, label)}"</p>

        <h3 className="sub-title">장소 정보</h3>
        <div className="tag-list">
          {tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>

        <section className="review-card">
          {targets.length === 0 ? (
            <p className="muted save-hint">이 도시로 여행을 만들면 가고 싶은 곳으로 저장할 수 있어요.</p>
          ) : (
            <div className="save-buttons">
              {targets.map((t) => {
                const saved = isSaved(t, place.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={saved ? 'save-pill saved' : 'save-pill'}
                    aria-pressed={saved}
                    onClick={() => onUpdateTrip(saved ? unsavePlace(t, place.id) : savePlace(t, place))}
                  >
                    {saved ? '♥ 저장했어요' : '♡ 가고 싶은 곳에 저장'}
                    {targets.length > 1 && ` (${t.departDate} 여행)`}
                  </button>
                )
              })}
            </div>
          )}
          {place.openingHours && (
            <p>
              <strong>영업시간</strong> {place.openingHours}
            </p>
          )}
          {place.description && <p>{place.description}</p>}
          {readable && summary && (
            <p>
              {summary.extract}{' '}
              <a href={summary.pageUrl} target="_blank" rel="noreferrer">
                (위키백과)
              </a>
            </p>
          )}
          {!place.openingHours && !place.description && !readable && <p className="muted">오픈스트리트맵에 등록된 설명이 없어요.</p>}
          <div className="link-row">
            {mapLinks(place).map((l) => (
              <a key={l.label} className="link-button" href={l.url} target="_blank" rel="noreferrer">
                🗺️ {l.label}
              </a>
            ))}
            {place.website && (
              <a className="link-button" href={place.website} target="_blank" rel="noreferrer">
                🔗 웹사이트
              </a>
            )}
          </div>
        </section>
        <p className="source">
          출처: <a href={place.osmUrl} target="_blank" rel="noreferrer">© OpenStreetMap 기여자</a>
          {summary && (
            <>
              {' '}
              · 사진·설명: <a href={summary.pageUrl} target="_blank" rel="noreferrer">위키백과</a>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
