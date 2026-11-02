import { describe, expect, it } from 'vitest'
import { POPULAR_CITIES } from '../data/cities'
import { sampleTrip } from '../test/fixtures'
import type { Place } from './api/overpass'
import { isSaved, savedPlaces, savePlace, sortSaved, tripsForCity, unsavePlace, updateSaved, visitDateError } from './saved'

function place(id: string): Place {
  return { id, name: id, category: 'museum', lat: 35.68, lon: 139.77, distanceKm: 1, cuisine: [], osmUrl: `https://www.openstreetmap.org/node/${id}` }
}

const trip = sampleTrip() // 2026-12-01 ~ 2026-12-05, 도쿄

describe('가고 싶은 곳 저장 (3-1, 3-3)', () => {
  it('저장하고 해제한다, 원래 여행은 바뀌지 않는다', () => {
    const saved = savePlace(trip, place('a'), new Date('2026-11-02T00:00:00Z'))
    expect(isSaved(saved, 'a')).toBe(true)
    expect(savedPlaces(saved)[0]).toEqual({ place: place('a'), memo: '', savedAt: '2026-11-02T00:00:00.000Z' })
    expect(isSaved(unsavePlace(saved, 'a'), 'a')).toBe(false)
    expect(savedPlaces(trip)).toEqual([])
  })

  it('같은 장소는 두 번 저장되지 않는다', () => {
    const once = savePlace(trip, place('a'))
    expect(savePlace(once, place('a'))).toBe(once)
    expect(savedPlaces(once)).toHaveLength(1)
  })

  it('메모와 방문 예정일을 고치고, 날짜를 비우면 없앤다', () => {
    let t = savePlace(trip, place('a'))
    t = updateSaved(t, 'a', { memo: '  오전에 가기 ', visitDate: '2026-12-02' })
    expect(savedPlaces(t)[0]).toMatchObject({ memo: '오전에 가기', visitDate: '2026-12-02' })
    t = updateSaved(t, 'a', { visitDate: '' })
    expect(savedPlaces(t)[0].visitDate).toBeUndefined()
    expect(savedPlaces(t)[0].memo).toBe('오전에 가기')
  })

  it('방문 예정일은 여행 기간 안이어야 한다 (첫날·마지막 날 포함)', () => {
    expect(visitDateError(trip, '2026-12-01')).toBeNull()
    expect(visitDateError(trip, '2026-12-05')).toBeNull()
    expect(visitDateError(trip, '2026-11-30')).toMatch('여행 기간')
    expect(visitDateError(trip, '2026-12-06')).toMatch('여행 기간')
    expect(visitDateError(trip, '')).toBeNull()
  })

  it('방문 예정일 순으로, 날짜 없는 곳은 뒤에 모은다', () => {
    let t = trip
    for (const [id, at] of [['a', '01'], ['b', '02'], ['c', '03']]) t = savePlace(t, place(id), new Date(`2026-11-${at}T00:00:00Z`))
    t = updateSaved(t, 'c', { visitDate: '2026-12-02' })
    t = updateSaved(t, 'b', { visitDate: '2026-12-04' })
    expect(sortSaved(savedPlaces(t)).map((s) => s.place.id)).toEqual(['c', 'b', 'a'])
  })

  it('같은 도시 여행에만 저장할 수 있다', () => {
    const osaka = sampleTrip({ id: 'o', city: POPULAR_CITIES.find((c) => c.id === 'osaka')! })
    expect(tripsForCity([trip, osaka], POPULAR_CITIES[0]).map((t) => t.id)).toEqual(['t1'])
  })
})
