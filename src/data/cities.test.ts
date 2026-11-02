import { describe, expect, it } from 'vitest'
import { POPULAR_CITIES, REGIONS } from './cities'

describe('인기 도시 데이터 (1-2, 1-7)', () => {
  it('20곳이고 id·이름이 겹치지 않는다', () => {
    expect(POPULAR_CITIES).toHaveLength(20)
    expect(new Set(POPULAR_CITIES.map((c) => c.id)).size).toBe(20)
    expect(new Set(POPULAR_CITIES.map((c) => c.name)).size).toBe(20)
  })

  it('필수 값이 모두 있고 좌표가 올바른 범위다', () => {
    for (const c of POPULAR_CITIES) {
      expect(c.name && c.nameEn && c.country && c.region && c.wikiTitle, c.id).toBeTruthy()
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(c.lon)).toBeLessThanOrEqual(180)
      expect(c.radiusKm).toBeGreaterThan(0)
    }
  })

  it('모든 도시와 공항에 위키데이터 출처가 있다', () => {
    for (const c of POPULAR_CITIES) {
      expect(c.source, c.id).toMatch(/^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/)
      expect(c.airports.length, c.id).toBeGreaterThan(0)
      for (const a of c.airports) {
        expect(a.iata, `${c.id} ${a.name}`).toMatch(/^[A-Z]{3}$/)
        expect(a.source).toMatch(/^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/)
      }
    }
  })

  it('지역 묶음으로 모든 도시를 거를 수 있다', () => {
    const covered = REGIONS.flatMap((r) => POPULAR_CITIES.filter((c) => c.region === r))
    expect(covered).toHaveLength(20)
  })
})
