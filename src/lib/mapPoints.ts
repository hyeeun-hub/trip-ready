import type { Place } from './api/overpass'

export interface MapPoint {
  id: string
  lat: number
  lon: number
  label: string
  kind: 'sight' | 'food' | 'saved'
}

const FOOD = new Set(['restaurant', 'cafe'])

/** 장소 → 지도 핀. 저장한 장소는 따로 표시한다. */
export function toPoints(places: Place[], savedIds: ReadonlySet<string> = new Set()): MapPoint[] {
  return places.map((p) => ({
    id: p.id,
    lat: p.lat,
    lon: p.lon,
    label: p.name,
    kind: savedIds.has(p.id) ? 'saved' : FOOD.has(p.category) ? 'food' : 'sight',
  }))
}

/** 핀이 모두 보이는 범위 [[남, 서], [북, 동]]. 핀이 없으면 null. */
export function boundsOf(points: { lat: number; lon: number }[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null
  const lats = points.map((p) => p.lat)
  const lons = points.map((p) => p.lon)
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ]
}

/** 같은 장소가 명소·식당 양쪽에 있으면 하나만 남긴다 */
export function uniquePlaces(lists: Place[][]): Place[] {
  const seen = new Set<string>()
  return lists.flat().filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
}
