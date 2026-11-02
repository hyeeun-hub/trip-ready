import { describe, expect, it } from 'vitest'
import { POPULAR_CITIES } from '../data/cities'
import { memoryStore, sampleTrip } from '../test/fixtures'
import type { City } from '../types'
import { findCity, findPlace, rememberCity, rememberPlace, searchedCities } from './cityRegistry'

const kyoto: City = { ...POPULAR_CITIES[0], id: 'osm-relation-357794', name: '교토시', region: '검색', airports: [] }

describe('도시 찾기 (주소로 다시 열기)', () => {
  it('인기 도시, 여행의 도시, 검색했던 도시 순으로 찾는다', () => {
    const store = memoryStore()
    expect(findCity('tokyo', [], store)?.name).toBe('도쿄')
    expect(findCity(kyoto.id, [], store)).toBeUndefined()
    expect(findCity(kyoto.id, [sampleTrip({ city: kyoto })], store)?.name).toBe('교토시')
    rememberCity(kyoto, store)
    expect(findCity(kyoto.id, [], store)?.name).toBe('교토시')
  })

  it('인기 도시는 따로 기억하지 않고, 같은 도시는 한 번만', () => {
    const store = memoryStore()
    rememberCity(POPULAR_CITIES[0], store)
    rememberCity(kyoto, store)
    rememberCity(kyoto, store)
    expect(searchedCities(store).map((c) => c.id)).toEqual([kyoto.id])
  })
})

describe('장소 찾기 (주소로 다시 열기)', () => {
  const place = { id: 'node-7', name: '에도성', category: 'history', lat: 35.68, lon: 139.75, distanceKm: 1.9, cuisine: [], osmUrl: 'https://www.openstreetmap.org/node/7' } as const

  function fakeStorage(entries: Record<string, string>): Storage {
    const keys = Object.keys(entries)
    return { length: keys.length, key: (i: number) => keys[i] ?? null, getItem: (k: string) => entries[k] ?? null } as Storage
  }

  it('저장한 곳과 캐시된 명소 목록에서 찾는다', () => {
    const trip = sampleTrip({ savedPlaces: [{ place: { ...place, cuisine: [] }, memo: '', savedAt: '' }] })
    expect(findPlace('tokyo', 'node-7', [trip], null)?.name).toBe('에도성')
    const storage = fakeStorage({ 'tripready:cache:osm:sights:tokyo:35.68,139.77': JSON.stringify({ savedAt: 0, value: [place] }) })
    expect(findPlace('tokyo', 'node-7', [], storage)?.name).toBe('에도성')
    expect(findPlace('osaka', 'node-7', [], storage)).toBeUndefined()
  })

  it('이번에 연 장소는 바로 찾는다', () => {
    rememberPlace({ ...place, id: 'node-8', cuisine: [] })
    expect(findPlace('tokyo', 'node-8', [], null)?.id).toBe('node-8')
  })
})
