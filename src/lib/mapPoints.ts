import type { City } from '../types'
import { loadPlaces, type Place, type PlaceKind } from './api/overpass'

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

const KINDS: PlaceKind[] = ['sights', 'food']

/**
 * 지도용 장소: 명소·식당을 따로 불러와 하나라도 오면 쓴다. 둘 다 실패해야 오류로 본다.
 * (공개 서버가 붐빌 때 식당만 실패해도 지도 전체가 안 보이던 문제, TODO 7-4)
 */
export async function loadMapPlaces(
  city: City,
  load: (city: City, kind: PlaceKind) => Promise<Place[]> = loadPlaces,
): Promise<{ places: Place[]; failed: PlaceKind[] }> {
  const results = await Promise.allSettled(KINDS.map((k) => load(city, k)))
  const failed = KINDS.filter((_, i) => results[i].status === 'rejected')
  if (failed.length === KINDS.length) throw (results[0] as PromiseRejectedResult).reason
  const lists = results.map((r) => (r.status === 'fulfilled' ? r.value : []))
  return { places: uniquePlaces(lists), failed }
}
