import { describe, expect, it } from 'vitest'
import type { Place } from './api/overpass'
import { cuisineLabel, filterPlaces, mapLinks, placeTagline } from './places'

function place(extra: Partial<Place>): Place {
  return { id: 'node-1', name: 'A', category: 'restaurant', lat: 13.75, lon: 100.49, distanceKm: 1.2, cuisine: [], osmUrl: 'https://www.openstreetmap.org/node/1', ...extra }
}

describe('장소 거르기와 상세 (2-7)', () => {
  const places = [
    place({ id: 'a', category: 'museum' }),
    place({ id: 'b', cuisine: ['noodle', 'thai'] }),
    place({ id: 'c', category: 'cafe', cuisine: ['coffee_shop'] }),
  ]

  it('전체 / 종류 / 음식 종류로 거른다', () => {
    expect(filterPlaces(places, 'all')).toHaveLength(3)
    expect(filterPlaces(places, 'museum').map((p) => p.id)).toEqual(['a'])
    expect(filterPlaces(places, 'cuisine:thai').map((p) => p.id)).toEqual(['b'])
  })

  it('음식 종류는 한국어로, 모르는 값은 그대로', () => {
    expect(cuisineLabel('noodle')).toBe('국수')
    expect(cuisineLabel('fish_and_chips')).toBe('fish and chips')
  })

  it('한 줄 소개는 데이터에 있는 사실만 쓴다', () => {
    expect(placeTagline(places[1], '방콕', '식당')).toBe('방콕 중심에서 1.2km 떨어진 국수·태국 식당')
    expect(placeTagline(places[0], '방콕', '박물관·미술관')).toBe('방콕 중심에서 1.2km 떨어진 박물관·미술관')
  })

  it('지도 링크는 좌표로 연다', () => {
    const [osm, google] = mapLinks(places[0])
    expect(osm.url).toContain('mlat=13.75&mlon=100.49')
    expect(google.url).toBe('https://www.google.com/maps/search/?api=1&query=13.75%2C100.49')
  })
})
