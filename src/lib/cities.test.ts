import { describe, expect, it } from 'vitest'
import { POPULAR_CITIES } from '../data/cities'
import { cityGradient, filterCities } from './cities'

describe('인기 도시 거르기 (1-3)', () => {
  it('한국어·영어·나라 이름으로 찾는다', () => {
    expect(filterCities(POPULAR_CITIES, '오사카', null).map((c) => c.id)).toEqual(['osaka'])
    expect(filterCities(POPULAR_CITIES, 'bang', null).map((c) => c.id)).toEqual(['bangkok'])
    expect(filterCities(POPULAR_CITIES, '베트남', null).map((c) => c.id)).toEqual(['danang', 'nhatrang', 'hanoi'])
  })

  it('지역 칩으로 거르고, 검색어와 함께 쓸 수 있다', () => {
    expect(filterCities(POPULAR_CITIES, '', '유럽').map((c) => c.id)).toEqual(['paris', 'london', 'barcelona'])
    expect(filterCities(POPULAR_CITIES, '런', '유럽').map((c) => c.id)).toEqual(['london'])
    expect(filterCities(POPULAR_CITIES, '', null)).toHaveLength(20)
  })

  it('같은 도시는 항상 같은 기본 색', () => {
    expect(cityGradient('tokyo')).toBe(cityGradient('tokyo'))
    expect(cityGradient('tokyo')).not.toBe(cityGradient('paris'))
  })
})
