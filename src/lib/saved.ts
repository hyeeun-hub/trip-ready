import type { City, SavedPlace, Trip } from '../types'
import type { Place } from './api/overpass'

export function savedPlaces(trip: Trip): SavedPlace[] {
  return trip.savedPlaces ?? []
}

export function isSaved(trip: Trip, placeId: string): boolean {
  return savedPlaces(trip).some((s) => s.place.id === placeId)
}

/** 저장 (이미 저장했으면 그대로) */
export function savePlace(trip: Trip, place: Place, now: Date = new Date()): Trip {
  if (isSaved(trip, place.id)) return trip
  return { ...trip, savedPlaces: [...savedPlaces(trip), { place, memo: '', savedAt: now.toISOString() }] }
}

export function unsavePlace(trip: Trip, placeId: string): Trip {
  return { ...trip, savedPlaces: savedPlaces(trip).filter((s) => s.place.id !== placeId) }
}

/** 방문 예정일은 여행 기간 안이어야 한다. 비우면 날짜 없음. 문제가 없으면 null. */
export function visitDateError(trip: Trip, date: string): string | null {
  if (!date) return null
  if (date < trip.departDate || date > trip.returnDate) return `방문 예정일은 여행 기간(${trip.departDate} ~ ${trip.returnDate}) 안이어야 해요.`
  return null
}

export function updateSaved(trip: Trip, placeId: string, changes: { memo?: string; visitDate?: string }): Trip {
  return {
    ...trip,
    savedPlaces: savedPlaces(trip).map((s) =>
      s.place.id === placeId
        ? {
            ...s,
            ...(changes.memo !== undefined ? { memo: changes.memo.trim() } : {}),
            ...(changes.visitDate !== undefined ? { visitDate: changes.visitDate || undefined } : {}),
          }
        : s,
    ),
  }
}

/** 방문 예정일 순(날짜 없는 것은 뒤), 같으면 저장한 순 */
export function sortSaved(list: SavedPlace[]): SavedPlace[] {
  return [...list].sort((a, b) => {
    if (a.visitDate && b.visitDate && a.visitDate !== b.visitDate) return a.visitDate.localeCompare(b.visitDate)
    if (!!a.visitDate !== !!b.visitDate) return a.visitDate ? -1 : 1
    return a.savedAt.localeCompare(b.savedAt)
  })
}

/** 이 도시로 가는 여행 (장소를 저장할 수 있는 여행) */
export function tripsForCity(trips: Trip[], city: City): Trip[] {
  return trips.filter((t) => t.city.id === city.id)
}
