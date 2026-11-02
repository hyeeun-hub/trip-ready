import { POPULAR_CITIES } from '../data/cities'
import type { City, Trip } from '../types'
import type { Place } from './api/overpass'
import { defaultStore, type KeyValueStore } from './storage'

const KEY = 'tripready:v2:searched-cities'

/** 검색으로 연 도시를 기억해 둔다 (주소 #/city/osm-... 를 새로고침해도 열리도록) */
export function rememberCity(city: City, store: KeyValueStore | null = defaultStore()): void {
  if (POPULAR_CITIES.some((c) => c.id === city.id)) return
  try {
    const list = searchedCities(store).filter((c) => c.id !== city.id)
    store?.setItem(KEY, JSON.stringify([city, ...list].slice(0, 30)))
  } catch {
    // 저장이 안 되면 이번 화면에서만 쓴다
  }
}

export function searchedCities(store: KeyValueStore | null = defaultStore()): City[] {
  try {
    const raw = store?.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as City[]) : []
  } catch {
    return []
  }
}

/** id로 도시 찾기: 인기 도시 → 내 여행의 도시 → 검색했던 도시 */
export function findCity(id: string, trips: Trip[], store: KeyValueStore | null = defaultStore()): City | undefined {
  return (
    POPULAR_CITIES.find((c) => c.id === id) ??
    trips.find((t) => t.city.id === id)?.city ??
    searchedCities(store).find((c) => c.id === id)
  )
}

/** 이번 방문 중에 연 장소 (주소 #/place/... 에서 다시 찾기 위해) */
const openedPlaces = new Map<string, Place>()

export function rememberPlace(place: Place): void {
  openedPlaces.set(place.id, place)
}

/** 캐시에 남아 있는 이 도시의 명소·식당 목록 (localStorage 전체를 훑는다) */
function cachedPlaceLists(cityId: string, storage: Storage | null): Place[][] {
  if (!storage) return []
  const lists: Place[][] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key || !/^tripready:cache:osm:(sights|food):/.test(key) || !key.includes(`:${cityId}:`)) continue
    try {
      lists.push((JSON.parse(storage.getItem(key) ?? '{}') as { value?: Place[] }).value ?? [])
    } catch {
      // 깨진 캐시는 건너뛴다
    }
  }
  return lists
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** id로 장소 찾기: 이번에 연 장소 → 저장한 곳 → 하루 캐시해 둔 명소·식당 목록 */
export function findPlace(cityId: string, placeId: string, trips: Trip[], storage: Storage | null = browserStorage()): Place | undefined {
  const opened = openedPlaces.get(placeId)
  if (opened) return opened
  for (const t of trips) {
    const saved = t.savedPlaces?.find((s) => s.place.id === placeId)
    if (saved) return saved.place
  }
  for (const list of cachedPlaceLists(cityId, storage)) {
    const found = list.find((p) => p.id === placeId)
    if (found) return found
  }
  return undefined
}
