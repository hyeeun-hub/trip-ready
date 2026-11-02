import type { Place } from '../lib/api/overpass'
import { loadMapPlaces, toPoints } from '../lib/mapPoints'
import { useAsync } from '../lib/useAsync'
import type { City } from '../types'
import { AsyncView } from './AsyncView'
import { PlaceMap } from './PlaceMap'

interface Props {
  city: City
  savedIds?: ReadonlySet<string>
  onOpenPlace: (place: Place) => void
}

/** 도시 지도: 명소·식당 핀, 저장한 곳은 빨간 핀 (TODO 7-2) */
export function CityMap({ city, savedIds, onOpenPlace }: Props) {
  const state = useAsync(`map:${city.id}`, () => loadMapPlaces(city))
  return (
    <AsyncView state={state} loading="지도에 올릴 명소·식당을 불러오는 중이에요. 처음에는 1분 가까이 걸릴 수 있어요.">
      {({ places, failed }) => (
        <>
          <div className="map-legend">
            <span><i className="dot sight" /> 명소</span>
            <span><i className="dot food" /> 식당·카페</span>
            {savedIds && savedIds.size > 0 && <span><i className="dot saved" /> 저장한 곳</span>}
            <span className="muted">핀을 누르면 상세 정보로 가요.</span>
          </div>
          {failed.length > 0 && (
            <p className="status error" role="alert">
              {failed.includes('food') ? '식당·카페' : '명소'} 정보를 불러오지 못해 나머지만 보여요.
              <button type="button" className="secondary" onClick={state.retry}>
                다시 시도
              </button>
            </p>
          )}
          <PlaceMap
            center={city}
            points={toPoints(places, savedIds)}
            height={420}
            onSelect={(id) => {
              const place = places.find((p) => p.id === id)
              if (place) onOpenPlace(place)
            }}
          />
        </>
      )}
    </AsyncView>
  )
}
