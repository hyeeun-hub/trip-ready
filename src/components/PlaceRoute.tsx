import { findPlaceAnywhere } from '../lib/cityRegistry'
import { useAsync } from '../lib/useAsync'
import type { City, Trip } from '../types'
import { AsyncView } from './AsyncView'
import { BackLink } from './BackLink'
import { PlaceDetail } from './PlaceDetail'

interface Props {
  city: City
  placeId: string
  trips: Trip[]
  onUpdateTrip: (trip: Trip) => void
}

/** 주소 #/place/도시/장소 로 연 장소 상세: 저장한 곳·캐시·미리 받은 데이터에서 장소를 찾는다 */
export function PlaceRoute({ city, placeId, trips, onUpdateTrip }: Props) {
  const place = useAsync(`find:${city.id}:${placeId}`, () => findPlaceAnywhere(city.id, placeId, trips))
  return (
    <AsyncView state={place} loading="장소를 찾는 중이에요.">
      {(found) =>
        found ? (
          <PlaceDetail place={found} city={city} trips={trips} onUpdateTrip={onUpdateTrip} />
        ) : (
          <div className="container narrow">
            <BackLink />
            <div className="card empty">
              <h3>장소 정보를 찾을 수 없어요.</h3>
            </div>
          </div>
        )
      }
    </AsyncView>
  )
}
