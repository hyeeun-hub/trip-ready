import { describe, expect, it, vi } from 'vitest'
import { POPULAR_CITIES } from '../../data/cities'
import { memoryStore } from '../../test/fixtures'
import type { City } from '../../types'
import nominatimEmpty from './__fixtures__/nominatim-empty.json'
import nominatimKyoto from './__fixtures__/nominatim-kyoto.json'
import foodRaw from './__fixtures__/overpass-bangkok-food.json'
import sightsRaw from './__fixtures__/overpass-bangkok-sights.json'
import wikiBangkok from './__fixtures__/wiki-ko-bangkok.json'
import wikiParis from './__fixtures__/wiki-ko-paris-disambig.json'
import { cached, distanceKm, HttpError } from './http'
import { createRateLimiter, parseSearch, searchCities, searchUrl, searchVariants } from './nominatim'
import { buildQuery, parsePlaces, queryOverpass, topCuisines, type OverpassResponse } from './overpass'
import { parseSummary, parseWikipediaTag, summaryUrl } from './wikipedia'

// 고정 응답은 2026-11-02 실제 API에서 받아 줄인 것이다 (external-api-check 스킬 3번).
// 오픈스트리트맵 고정 응답은 방콕 왕궁 부근(13.7525, 100.4935)을 중심으로 받았으므로 같은 중심을 쓴다.
const sights = sightsRaw as unknown as OverpassResponse
const foodResponse = foodRaw as unknown as OverpassResponse
const bangkok: City = { ...(POPULAR_CITIES.find((c) => c.id === 'bangkok') as City), lat: 13.7525, lon: 100.4935 }

describe('위키백과 요약 (2-2)', () => {
  it('요약 주소: 공백은 밑줄, 한글은 인코딩', () => {
    expect(summaryUrl('ko', '파리 (프랑스)')).toBe(
      'https://ko.wikipedia.org/api/rest_v1/page/summary/%ED%8C%8C%EB%A6%AC_(%ED%94%84%EB%9E%91%EC%8A%A4)',
    )
  })

  it('실제 응답에서 제목·소개·사진·문서 주소를 꺼낸다', () => {
    const s = parseSummary(wikiBangkok, 'ko')
    expect(s?.title).toBe('방콕')
    expect(s?.extract.length).toBeGreaterThan(20)
    expect(s?.imageUrl).toMatch(/^https:\/\/.*wikimedia\.org\//)
    expect(s?.pageUrl).toMatch(/^https:\/\/ko\.wikipedia\.org\/wiki\//)
  })

  it('동음이의 문서와 빈 문서는 쓰지 않는다', () => {
    expect(parseSummary(wikiParis, 'ko')).toBeNull()
    expect(parseSummary({ title: 'x', extract: '  ' }, 'ko')).toBeNull()
  })

  it('오픈스트리트맵 wikipedia 태그를 언어와 제목으로 나눈다', () => {
    expect(parseWikipediaTag('en:Rama VIII Bridge')).toEqual({ lang: 'en', title: 'Rama VIII Bridge' })
    expect(parseWikipediaTag('th:พระบรมราชานุสรณ์')).toEqual({ lang: 'th', title: 'พระบรมราชานุสรณ์' })
    expect(parseWikipediaTag('Rama VIII Bridge')).toBeNull()
  })
})

describe('오픈스트리트맵 명소·식당 (2-3, 2-4)', () => {
  it('질의에 도시 좌표·반경이 들어가고, 이름 있는 장소만 찾는다', () => {
    const q = buildQuery(bangkok, 'sights')
    expect(q).toContain(`around:3000,${bangkok.lat},${bangkok.lon}`)
    expect(q).toContain('["name"]')
    expect(buildQuery(bangkok, 'food')).toContain('"^(restaurant|cafe)$"')
  })

  it('넓은 여행지는 명소를 위키데이터 있는 곳만, 식당은 3km 안에서만 찾는다', () => {
    const guam = POPULAR_CITIES.find((c) => c.id === 'guam') as City
    const sightsQuery = buildQuery(guam, 'sights')
    expect(sightsQuery).toContain('around:10000,')
    expect(sightsQuery.match(/\["wikidata"\]/g)?.length).toBe(3)
    expect(buildQuery(guam, 'food')).toContain('around:3000,')
    expect(buildQuery(bangkok, 'sights').match(/\["wikidata"\]/g)?.length).toBe(2)
  })

  it('실제 명소 응답 → 위키 문서가 있는 곳을 먼저, 그다음 가까운 순', () => {
    const places = parsePlaces(sights, bangkok)
    expect(places.length).toBeGreaterThan(5)
    const firstPlain = places.findIndex((p) => !p.wikipedia)
    expect(places.slice(0, firstPlain).every((p) => p.wikipedia)).toBe(true)
    const rest = places.slice(firstPlain).map((p) => p.distanceKm)
    expect(rest).toEqual([...rest].sort((a, b) => a - b))
    for (const p of places) {
      expect(p.distanceKm).toBeLessThanOrEqual(bangkok.radiusKm + 0.5)
      expect(p.osmUrl).toMatch(/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/)
    }
  })

  it('종류를 나눈다: 박물관·미술관, 역사, 관광지', () => {
    const byId = new Map(parsePlaces(sights, bangkok).map((p) => [p.id, p.category]))
    expect(byId.get('node-3568027498')).toBe('museum') // 국립 실파 피라시 박물관
    expect(byId.get('node-1886961362')).toBe('history') // 1차 세계대전 의용군 기념비 (historic=memorial)
    expect(byId.get('node-1872413363')).toBe('attraction') // 라마 8세 다리
  })

  it('영어 이름이 있으면 영어로 보여주고 현지 이름을 함께 둔다', () => {
    const bridge = parsePlaces(sights, bangkok).find((p) => p.wikipedia === 'en:Rama VIII Bridge')
    expect(bridge?.name).toBe('Rama VIII Bridge')
    expect(bridge?.localName).toBe('สะพานพระราม 8')
  })

  it('실제 식당 응답: way는 중심 좌표를 쓰고, 음식 종류를 나눈다', () => {
    const food = parsePlaces(foodResponse, bangkok)
    expect(food.map((p) => p.category)).toEqual(expect.arrayContaining(['restaurant', 'cafe']))
    expect(food.find((p) => p.name === 'Twist & Fork Pasta')?.cuisine).toEqual(['italian'])
    expect(topCuisines(food)[0]).toBe('noodle')
  })

  it('음식 종류는 소문자로 맞추고 중복을 없앤다', () => {
    const raw: OverpassResponse = {
      elements: [{ type: 'node', id: 9, lat: 13.75, lon: 100.49, tags: { amenity: 'restaurant', name: 'S', cuisine: 'Soba; soba;ramen' } }],
    }
    expect(parsePlaces(raw, bangkok)[0].cuisine).toEqual(['soba', 'ramen'])
  })

  it('이름·좌표가 없는 요소와 같은 이름은 건너뛴다', () => {
    const raw: OverpassResponse = {
      elements: [
        { type: 'node', id: 1, lat: 13.75, lon: 100.49, tags: { amenity: 'cafe', name: 'A' } },
        { type: 'node', id: 2, lat: 13.75, lon: 100.49, tags: { amenity: 'cafe', name: 'A' } },
        { type: 'node', id: 3, lat: 13.75, lon: 100.49, tags: { amenity: 'cafe' } },
        { type: 'way', id: 4, tags: { amenity: 'cafe', name: 'B' } },
      ],
    }
    expect(parsePlaces(raw, bangkok).map((p) => p.id)).toEqual(['node-1'])
  })

  it('서버가 실패하면 다음 서버로 넘어가고, 모두 실패하면 오류', async () => {
    const calls: string[] = []
    const request = async (url: string) => {
      calls.push(url)
      if (url.includes('first')) throw new HttpError(504, url)
      return { elements: [] }
    }
    await expect(queryOverpass('q', ['https://first', 'https://second'], request)).resolves.toEqual({ elements: [] })
    expect(calls).toEqual(['https://first', 'https://second'])
    const failing = async (url: string): Promise<never> => {
      throw new HttpError(429, url)
    }
    await expect(queryOverpass('q', ['https://a', 'https://b'], failing)).rejects.toThrow('HTTP 429')
  })
})

describe('도시 검색 (2-1)', () => {
  it('검색 주소: 정착지만, 한국어 결과, 이름·주소 상세 포함', () => {
    const url = new URL(searchUrl(' 교토시 '))
    expect(url.origin).toBe('https://nominatim.openstreetmap.org')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      q: '교토시',
      featureType: 'settlement',
      'accept-language': 'ko',
      namedetails: '1',
    })
  })

  it('실제 응답 → 도시 (공항 코드 없음, 출처는 오픈스트리트맵)', () => {
    const [kyoto] = parseSearch(nominatimKyoto)
    expect(kyoto).toMatchObject({ id: 'osm-relation-357794', name: '교토시', nameEn: 'Kyoto', country: '일본', airports: [] })
    expect(kyoto.source).toBe('https://www.openstreetmap.org/relation/357794')
    expect(parseSearch(nominatimEmpty)).toEqual([])
  })

  it('한글 검색어는 결과가 없을 때 "시"를 붙여 다시 찾는다', async () => {
    expect(searchVariants('교토')).toEqual(['교토', '교토시'])
    expect(searchVariants('교토시')).toEqual(['교토시'])
    expect(searchVariants('Kyoto')).toEqual(['Kyoto'])
    const urls: string[] = []
    const request = async (url: string) => {
      urls.push(new URL(url).searchParams.get('q') ?? '')
      return urls.length === 1 ? nominatimEmpty : nominatimKyoto
    }
    const found = await searchCities('교토(테스트)', request, async () => {})
    expect(found).toEqual([])
    const found2 = await searchCities('교토', request, async () => {})
    expect(found2[0].name).toBe('교토시')
  })

  it('요청 간격 1초를 지킨다', async () => {
    let clock = 0
    const sleeps: number[] = []
    const wait = createRateLimiter(1000, () => clock, async (ms) => {
      sleeps.push(ms)
      clock += ms
    })
    await wait()
    clock += 300
    await wait()
    clock += 1500
    await wait()
    expect(sleeps).toEqual([700])
  })
})

describe('캐시와 거리 (2-6)', () => {
  it('하루 안에는 다시 요청하지 않고, 지나면 새로 받는다', async () => {
    const store = memoryStore()
    let now = 0
    const load = vi.fn(async () => now)
    expect(await cached('k', load, { store, now: () => now })).toBe(0)
    now = 1000
    expect(await cached('k', load, { store, now: () => now })).toBe(0)
    now = 25 * 60 * 60 * 1000
    expect(await cached('k', load, { store, now: () => now })).toBe(now)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('실패한 요청은 캐시하지 않는다', async () => {
    const store = memoryStore()
    await expect(cached('x', () => Promise.reject(new Error('down')), { store })).rejects.toThrow('down')
    expect(await cached('x', async () => 'ok', { store })).toBe('ok')
  })

  it('거리 계산 (서울-부산 약 325km)', () => {
    expect(Math.round(distanceKm(37.5665, 126.978, 35.1796, 129.0756))).toBeGreaterThan(310)
    expect(Math.round(distanceKm(37.5665, 126.978, 35.1796, 129.0756))).toBeLessThan(340)
  })
})
