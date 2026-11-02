import type { City } from '../../types'
import { cached, fetchJson } from './http'

/**
 * 도시 검색 (TODO 2-1). Nominatim 이용 정책:
 * - 1초에 1번까지 → 마지막 요청 후 1초가 안 지났으면 기다린다
 * - 입력 중 자동완성 금지 → "검색" 버튼을 눌렀을 때만 부른다
 * - 결과를 캐시하고, 화면에 © OpenStreetMap 출처를 표시한다
 * 브라우저가 Referer로 앱을 알리므로 User-Agent는 따로 넣지 않는다.
 */
export function searchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    limit: '5',
    featureType: 'settlement',
    addressdetails: '1',
    namedetails: '1',
    'accept-language': 'ko',
  })
  return `https://nominatim.openstreetmap.org/search?${params}`
}

interface RawPlace {
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  name?: string
  display_name: string
  address?: { country?: string; state?: string; province?: string }
  namedetails?: Record<string, string>
}

/** 검색 결과 → 도시. 공항 코드는 모르므로 비워 두고, 항공권은 도시 이름으로 찾는다. */
export function parseSearch(raw: RawPlace[]): City[] {
  const seen = new Set<string>()
  const cities: City[] = []
  for (const r of raw) {
    const id = `osm-${r.osm_type}-${r.osm_id}`
    if (seen.has(id)) continue
    seen.add(id)
    const name = r.name || r.display_name.split(',')[0].trim()
    cities.push({
      id,
      name,
      nameEn: r.namedetails?.['name:en'] ?? r.namedetails?.name ?? name,
      country: r.address?.country ?? '',
      region: '검색',
      area: r.address?.state ?? r.address?.province,
      lat: Number(r.lat),
      lon: Number(r.lon),
      radiusKm: 3,
      airports: [],
      source: `https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}`,
    })
  }
  return cities
}

/** 마지막 요청 시각을 기억해 1초 간격을 지킨다. */
export function createRateLimiter(intervalMs = 1000, now = () => Date.now(), sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))) {
  let last = -Infinity
  return async function wait(): Promise<void> {
    const gap = last + intervalMs - now()
    if (gap > 0) await sleep(gap)
    last = now()
  }
}

const waitTurn = createRateLimiter()

/**
 * 오픈스트리트맵의 한국어 이름에는 "교토시"처럼 "시"가 붙은 경우가 많아,
 * 한글 검색어가 결과 없이 끝나면 "시"를 붙여 한 번 더 찾는다.
 */
export function searchVariants(query: string): string[] {
  const q = query.trim()
  if (!q) return []
  return /[가-힣]$/.test(q) && !q.endsWith('시') ? [q, `${q}시`] : [q]
}

export function searchCities(query: string, request = (url: string) => fetchJson<RawPlace[]>(url), wait = waitTurn): Promise<City[]> {
  const variants = searchVariants(query)
  if (variants.length === 0) return Promise.resolve([])
  return cached(`nominatim:${variants[0].toLowerCase()}`, async () => {
    for (const q of variants) {
      await wait()
      const found = parseSearch(await request(searchUrl(q)))
      if (found.length > 0) return found
    }
    return []
  })
}
