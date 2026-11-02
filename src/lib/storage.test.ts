import { describe, expect, it } from 'vitest'
import { memoryStore, sampleTrip } from '../test/fixtures'
import { loadTrips, saveTrips, TRIPS_KEY, type KeyValueStore } from './storage'

describe('여행 저장·불러오기 (1-4)', () => {
  it('저장한 여행·체크리스트·메모를 그대로 불러온다 (새로고침 상황)', () => {
    const store = memoryStore()
    const trip = sampleTrip({
      checklist: [{ id: 'default-0', title: '여권 유효기간 확인', done: true, custom: false }],
      memos: [{ id: 'm', date: '2026-12-01', text: '도착' }],
    })
    expect(saveTrips([trip], store)).toBe(true)
    expect(loadTrips(store)).toEqual([trip])
  })

  it('값이 없거나 깨졌으면 빈 목록', () => {
    expect(loadTrips(memoryStore())).toEqual([])
    expect(loadTrips(memoryStore({ [TRIPS_KEY]: '{oops' }))).toEqual([])
    expect(loadTrips(null)).toEqual([])
  })

  it('형식이 맞지 않는 여행만 건너뛴다', () => {
    const ok = sampleTrip()
    const broken = { ...sampleTrip({ id: 't2' }), departDate: '2026/12/01' }
    expect(loadTrips(memoryStore({ [TRIPS_KEY]: JSON.stringify([ok, broken]) }))).toEqual([ok])
  })

  it('저장소가 막혀 있으면 false를 돌려주고 멈추지 않는다', () => {
    const full: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(saveTrips([sampleTrip()], full)).toBe(false)
    expect(saveTrips([sampleTrip()], null)).toBe(false)
  })
  it('저장한 곳도 함께 저장되고, 형식이 깨진 저장 목록이 있는 여행은 건너뛴다 (3-3)', () => {
    const place = { id: 'node-1', name: 'A', category: 'museum', lat: 1, lon: 2, distanceKm: 0.5, cuisine: [], osmUrl: 'https://www.openstreetmap.org/node/1' } as const
    const ok = sampleTrip({ id: 'ok', savedPlaces: [{ place: { ...place, cuisine: [] }, memo: '오전', visitDate: '2026-12-02', savedAt: 'x' }] })
    const broken = { ...sampleTrip({ id: 'broken' }), savedPlaces: [{ memo: '장소 없음' }] }
    const store = memoryStore({ [TRIPS_KEY]: JSON.stringify([ok, broken]) })
    expect(loadTrips(store)).toEqual([ok])
  })
  it('예산과 지출도 저장되고, 금액이 숫자가 아닌 지출이 있는 여행은 건너뛴다 (4단계)', () => {
    const ok = sampleTrip({
      id: 'ok',
      budget: { total: 1_000_000, byCategory: { food: 200_000 } },
      expenses: [{ id: 'e1', date: '2026-12-02', category: 'food', amount: 12_000, memo: '라멘' }],
    })
    const broken = { ...sampleTrip({ id: 'broken' }), expenses: [{ id: 'e2', date: '2026-12-02', category: 'food', amount: '12000', memo: '' }] }
    expect(loadTrips(memoryStore({ [TRIPS_KEY]: JSON.stringify([ok, broken]) }))).toEqual([ok])
  })
})
