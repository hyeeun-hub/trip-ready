import { POPULAR_CITIES } from '../data/cities'
import type { KeyValueStore } from '../lib/storage'
import type { Trip } from '../types'

export function memoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
}

export function sampleTrip(extra: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    city: POPULAR_CITIES[0],
    originName: '서울',
    originIata: 'ICN',
    departDate: '2026-12-01',
    returnDate: '2026-12-05',
    travelers: 2,
    checklist: [],
    memos: [],
    createdAt: '2026-11-02T00:00:00.000Z',
    ...extra,
  }
}
