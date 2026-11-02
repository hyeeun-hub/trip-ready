import { describe, expect, it } from 'vitest'
import type { Place } from './api/overpass'
import { boundsOf, toPoints, uniquePlaces } from './mapPoints'

function place(id: string, category: Place['category'], lat: number, lon: number): Place {
  return { id, name: id, category, lat, lon, distanceKm: 0, cuisine: [], osmUrl: `https://www.openstreetmap.org/node/${id}` }
}

describe('지도 핀 (7-2)', () => {
  const places = [place('a', 'museum', 34.69, 135.5), place('b', 'restaurant', 34.7, 135.49), place('c', 'cafe', 34.68, 135.52)]

  it('명소·식당·저장한 곳을 나눠 핀으로 만든다', () => {
    expect(toPoints(places, new Set(['c'])).map((p) => [p.id, p.kind])).toEqual([
      ['a', 'sight'],
      ['b', 'food'],
      ['c', 'saved'],
    ])
  })

  it('핀이 모두 보이는 범위를 구하고, 핀이 없으면 null', () => {
    expect(boundsOf(places)).toEqual([
      [34.68, 135.49],
      [34.7, 135.52],
    ])
    expect(boundsOf([])).toBeNull()
  })

  it('명소·식당 목록에 같은 장소가 있으면 하나만', () => {
    expect(uniquePlaces([[places[0], places[1]], [places[1], places[2]]]).map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})
