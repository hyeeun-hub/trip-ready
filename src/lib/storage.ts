import type { Trip } from '../types'
import { isISODate } from './date'
import { migrateMemos } from './journal'

export const TRIPS_KEY = 'tripready:v2:trips'

/** localStorage와 같은 모양. 테스트에서는 메모리 구현을 넣는다. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

export function defaultStore(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function isTrip(value: unknown): value is Trip {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  const city = t.city as Record<string, unknown> | undefined
  return (
    typeof t.id === 'string' &&
    typeof city === 'object' &&
    city !== null &&
    typeof city.name === 'string' &&
    typeof city.lat === 'number' &&
    typeof city.lon === 'number' &&
    isISODate(t.departDate) &&
    isISODate(t.returnDate) &&
    typeof t.travelers === 'number' &&
    Array.isArray(t.checklist) &&
    Array.isArray(t.memos) &&
    (t.savedPlaces === undefined ||
      (Array.isArray(t.savedPlaces) &&
        t.savedPlaces.every((s: { place?: { id?: unknown } }) => typeof s?.place?.id === 'string'))) &&
    (t.budget === undefined || (typeof t.budget === 'object' && t.budget !== null && typeof (t.budget as { total?: unknown }).total === 'number')) &&
    (t.expenses === undefined ||
      (Array.isArray(t.expenses) &&
        t.expenses.every((e: { id?: unknown; amount?: unknown; date?: unknown }) => typeof e?.id === 'string' && typeof e.amount === 'number' && isISODate(e.date)))) &&
    (t.journal === undefined ||
      (Array.isArray(t.journal) && t.journal.every((e: { id?: unknown; date?: unknown }) => typeof e?.id === 'string' && isISODate(e.date))))
  )
}

/** 저장된 여행 목록. 값이 없거나 깨졌으면 빈 목록, 형식이 맞지 않는 여행은 건너뛴다. */
export function loadTrips(store: KeyValueStore | null = defaultStore()): Trip[] {
  if (!store) return []
  try {
    const raw = store.getItem(TRIPS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    // 메모 탭이 여행 기록 탭으로 합쳐져(8단계) 예전 메모는 불러올 때 기록으로 옮긴다
    return Array.isArray(parsed) ? parsed.filter(isTrip).map(migrateMemos) : []
  } catch {
    return []
  }
}

/** 저장. 저장 공간이 없거나 막혀 있으면 false. */
export function saveTrips(trips: Trip[], store: KeyValueStore | null = defaultStore()): boolean {
  if (!store) return false
  try {
    store.setItem(TRIPS_KEY, JSON.stringify(trips))
    return true
  } catch {
    return false
  }
}
