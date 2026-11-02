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
})
