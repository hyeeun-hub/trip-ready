import { describe, expect, it } from 'vitest'
import { CITY_INTROS } from '../data/cityIntros'
import { POPULAR_CITIES } from '../data/cities'
import type { City } from '../types'
import { cityIntro } from './intro'

const searched: City = { ...POPULAR_CITIES[0], id: 'osm-relation-357794', name: '교토시', country: '일본', area: '교토부', region: '검색', airports: [] }

describe('도시 소개 (7-1)', () => {
  it('인기 도시 20곳 모두 2~3문장의 짧은 소개가 있다', () => {
    for (const c of POPULAR_CITIES) {
      const intro = CITY_INTROS[c.id]
      expect(intro, c.id).toBeTruthy()
      const sentences = intro.split(/(?<=요\.)\s*/).filter(Boolean)
      expect(sentences.length, c.id).toBeGreaterThanOrEqual(2)
      expect(sentences.length, c.id).toBeLessThanOrEqual(3)
      expect(intro.length, c.id).toBeLessThanOrEqual(110)
    }
    expect(Object.keys(CITY_INTROS).sort()).toEqual(POPULAR_CITIES.map((c) => c.id).sort())
  })

  it('검색 도시는 나라·지역만으로 소개를 만든다', () => {
    expect(cityIntro(searched)).toBe('일본 교토부에 있는 도시예요. 명소·식당 탭에서 가 볼 만한 곳을 둘러보세요.')
    expect(cityIntro({ ...searched, area: undefined })).toBe('일본에 있는 도시예요. 명소·식당 탭에서 가 볼 만한 곳을 둘러보세요.')
    expect(cityIntro({ ...searched, country: '', area: undefined })).toBe('명소·식당 탭에서 가 볼 만한 곳을 둘러보세요.')
  })
})
