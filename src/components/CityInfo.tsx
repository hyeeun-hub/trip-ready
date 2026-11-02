import { useState } from 'react'
import { CATEGORY_LABELS, loadPlaces, topCuisines, type Place, type PlaceCategory, type PlaceKind } from '../lib/api/overpass'
import { flightLinks } from '../lib/flights'
import { cityIntro } from '../lib/intro'
import { cuisineLabel, filterPlaces } from '../lib/places'
import { useAsync } from '../lib/useAsync'
import type { City } from '../types'
import { AsyncView } from './AsyncView'
import { PlaceCard } from './PlaceCard'

const SIGHT_CATEGORIES: PlaceCategory[] = ['attraction', 'museum', 'viewpoint', 'history', 'park']

export function PlaceList({ city, kind, savedIds, onOpenPlace }: { city: City; kind: PlaceKind; savedIds?: ReadonlySet<string>; onOpenPlace: (p: Place) => void }) {
  const [filter, setFilter] = useState('all')
  const places = useAsync(`places:${kind}:${city.id}`, () => loadPlaces(city, kind))

  return (
    <AsyncView state={places} loading="오픈스트리트맵에서 불러오는 중이에요. 서버가 붐비면 1분 가까이 걸릴 수 있어요.">
      {(list) => {
        if (list.length === 0) {
          return <p className="muted">이 도시는 오픈스트리트맵에 등록된 {kind === 'sights' ? '명소' : '식당'} 정보가 적어요.</p>
        }
        const chips =
          kind === 'sights'
            ? SIGHT_CATEGORIES.filter((c) => list.some((p) => p.category === c)).map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))
            : [
                ...(['restaurant', 'cafe'] as const).map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
                ...topCuisines(list).map((c) => ({ value: `cuisine:${c}`, label: cuisineLabel(c) })),
              ]
        const shown = filterPlaces(list, filter)
        return (
          <>
            <div className="hashtags">
              {[{ value: 'all', label: '전체' }, ...chips].map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  className={filter === chip.value ? 'hashtag active' : 'hashtag'}
                  aria-pressed={filter === chip.value}
                  onClick={() => setFilter(chip.value)}
                >
                  #{chip.label}
                </button>
              ))}
            </div>
            <div className="card-grid">
              {shown.map((p) => (
                <PlaceCard key={p.id} place={p} saved={savedIds?.has(p.id)} onOpen={onOpenPlace} />
              ))}
            </div>
          </>
        )
      }}
    </AsyncView>
  )
}

interface IntroProps {
  city: City
  originIata: string
  departDate?: string
  returnDate?: string
  travelers?: number
}

/** 도시 소개(짧은 2~3줄)와 항공권 검색 링크 (TODO 2-5, 7-1) */
export function CityIntro({ city, originIata, departDate, returnDate, travelers }: IntroProps) {
  return (
    <>
      <section className="quote-card">
        <p className="quote">"{cityIntro(city)}"</p>
      </section>

      <section className="card">
        <h3>항공권 검색</h3>
        <p className="muted">가격은 각 사이트에서 확인해요. {city.airports.length === 0 && '공항 정보가 없어 도시 이름으로 찾아요.'}</p>
        <div className="link-row">
          {flightLinks({ originIata, city, departDate, returnDate, travelers }).map((l) => (
            <a key={l.label} className="link-button" href={l.url} target="_blank" rel="noreferrer">
              ✈️ {l.label}
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

export function OsmAttribution() {
  return (
    <p className="source">
      장소 정보: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap 기여자</a>. 평점은 없으며, 지역에 따라 빠진 곳이 있을 수 있어요.
    </p>
  )
}

/** 여행 화면 "둘러보기" 탭: 명소·식당 (TODO 2-3, 2-4, 2-7) */
export function CityPlaces({ city, savedIds, onOpenPlace }: { city: City; savedIds?: ReadonlySet<string>; onOpenPlace: (place: Place) => void }) {
  const [kind, setKind] = useState<PlaceKind>('sights')
  return (
    <section>
      <div className="segmented" role="tablist">
        {(['sights', 'food'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>
            {k === 'sights' ? '명소' : '식당·카페'}
          </button>
        ))}
      </div>
      <PlaceList key={kind} city={city} kind={kind} savedIds={savedIds} onOpenPlace={onOpenPlace} />
      <OsmAttribution />
    </section>
  )
}
