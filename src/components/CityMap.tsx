import { loadPlaces } from '../lib/api/overpass'
import { toPoints, uniquePlaces } from '../lib/mapPoints'
import { useAsync } from '../lib/useAsync'
import type { City } from '../types'
import type { Place } from '../lib/api/overpass'
import { AsyncView } from './AsyncView'
import { PlaceMap } from './PlaceMap'

interface Props {
  city: City
  savedIds?: ReadonlySet<string>
  onOpenPlace: (place: Place) => void
}

/** 도시 지도: 명소·식당 핀, 저장한 곳은 빨간 핀 (TODO 7-2) */
export function CityMap({ city, savedIds, onOpenPlace }: Props) {
  const places = useAsync(`map:${city.id}`, async () => uniquePlaces([await loadPlaces(city, 'sights'), await loadPlaces(city, 'food')]))
  return (
    <AsyncView state={places} loading="지도에 올릴 명소·식당을 불러오는 중이에요. 처음에는 1분 가까이 걸릴 수 있어요.">
      {(list) => (
        <>
          <div className="map-legend">
            <span><i className="dot sight" /> 명소</span>
            <span><i className="dot food" /> 식당·카페</span>
            {savedIds && savedIds.size > 0 && <span><i className="dot saved" /> 저장한 곳</span>}
            <span className="muted">핀을 누르면 상세 정보로 가요.</span>
          </div>
          <PlaceMap
            center={city}
            points={toPoints(list, savedIds)}
            height={420}
            onSelect={(id) => {
              const place = list.find((p) => p.id === id)
              if (place) onOpenPlace(place)
            }}
          />
        </>
      )}
    </AsyncView>
  )
}
