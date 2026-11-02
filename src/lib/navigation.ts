import type { City, Trip } from '../types'
import type { Place } from './api/overpass'
import { rememberPlace } from './cityRegistry'
import { navigate } from './router'

/** 장소 상세로 이동 (새로고침해도 찾을 수 있게 장소를 기억해 둔다) */
export function openPlace(city: City, place: Place): void {
  rememberPlace(place)
  navigate({ page: 'place', cityId: city.id, placeId: place.id })
}

export function goToTrip(trip: Trip): void {
  navigate({ page: 'trip', tripId: trip.id, tab: 'overview' })
}
