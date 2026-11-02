import { describe, expect, it } from 'vitest'
import { href, parseRoute, type Route } from './router'

describe('페이지 주소', () => {
  const routes: Route[] = [
    { page: 'home' },
    { page: 'explore' },
    { page: 'explore', query: '교토' },
    { page: 'city', cityId: 'tokyo', tab: 'about' },
    { page: 'city', cityId: 'osm-relation-357794', tab: 'food' },
    { page: 'city', cityId: 'tokyo', tab: 'map' },
    { page: 'new', cityId: 'tokyo' },
    { page: 'new' },
    { page: 'trips' },
    { page: 'trip', tripId: 'abc-123', tab: 'overview' },
    { page: 'trip', tripId: 'abc-123', tab: 'saved' },
    { page: 'trip', tripId: 'abc-123', tab: 'budget' },
    { page: 'trip', tripId: 'abc-123', tab: 'journal' },
    { page: 'place', cityId: 'tokyo', placeId: 'way-42' },
  ]

  it('주소로 만들었다가 다시 읽으면 같은 페이지 (한글 검색어 포함)', () => {
    for (const r of routes) expect(parseRoute(href(r))).toEqual(r)
  })

  it('모르는 주소·빈 주소는 홈, 모르는 탭은 첫 탭', () => {
    expect(parseRoute('')).toEqual({ page: 'home' })
    expect(parseRoute('#/nope')).toEqual({ page: 'home' })
    expect(parseRoute('#/city')).toEqual({ page: 'home' })
    expect(parseRoute('#/city/tokyo/nope')).toEqual({ page: 'city', cityId: 'tokyo', tab: 'about' })
    expect(parseRoute('#/trip/x/nope')).toEqual({ page: 'trip', tripId: 'x', tab: 'overview' })
    expect(parseRoute('#/trip/x/memo')).toEqual({ page: 'trip', tripId: 'x', tab: 'journal' })
  })
})
