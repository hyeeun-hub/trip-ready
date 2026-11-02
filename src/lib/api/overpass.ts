import type { City } from '../../types'
import { cached, distanceKm, fetchJson } from './http'

/** 장소 종류 (TODO 2-7 거르기용) */
export type PlaceCategory = 'attraction' | 'museum' | 'viewpoint' | 'history' | 'park' | 'restaurant' | 'cafe'
export type PlaceKind = 'sights' | 'food'

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  attraction: '관광지',
  museum: '박물관·미술관',
  viewpoint: '전망',
  history: '역사',
  park: '공원·자연',
  restaurant: '식당',
  cafe: '카페',
}

export interface Place {
  id: string
  /** 한국어 → 영어 → 현지 이름 순으로 있는 것 */
  name: string
  /** 현지 이름 (name과 다를 때만) */
  localName?: string
  category: PlaceCategory
  lat: number
  lon: number
  /** 도시 중심에서의 거리 */
  distanceKm: number
  cuisine: string[]
  address?: string
  openingHours?: string
  website?: string
  description?: string
  wikipedia?: string
  osmUrl: string
}

/**
 * Overpass 서버 목록. 이용 정책상 기본 서버(overpass-api.de)가 바쁘면(429·5xx·시간 초과) 다음 서버로 넘어간다.
 */
export const OVERPASS_SERVERS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']

/** 이 반경(km)을 넘는 넓은 여행지(섬 등)는 질의를 가볍게 만든다 */
export const WIDE_RADIUS_KM = 5

/**
 * 명소·식당 Overpass 질의 (반경 안, 이름이 있는 것만).
 * 넓은 여행지(발리 15km 등)는 공개 서버가 시간 초과를 내서, 명소는 위키데이터가 있는(널리 알려진) 곳만,
 * 식당은 중심 3km 안에서만 찾는다.
 */
export function buildQuery(city: City, kind: PlaceKind): string {
  const wide = city.radiusKm > WIDE_RADIUS_KM
  const radiusKm = kind === 'food' && wide ? 3 : city.radiusKm
  const around = `around:${Math.round(radiusKm * 1000)},${city.lat},${city.lon}`
  const notable = wide ? '["wikidata"]' : ''
  const filters =
    kind === 'sights'
      ? [
          `nwr(${around})["tourism"~"^(attraction|museum|gallery|viewpoint|theme_park|zoo|aquarium)$"]["name"]${notable};`,
          `nwr(${around})["historic"~"^(castle|monument|memorial|ruins|archaeological_site)$"]["name"]["wikidata"];`,
          `nwr(${around})["leisure"="park"]["name"]["wikidata"];`,
        ]
      : [`nwr(${around})["amenity"~"^(restaurant|cafe)$"]["name"];`]
  return `[out:json][timeout:25];(${filters.join('')});out center tags 300;`
}

export interface RawElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function categoryOf(tags: Record<string, string>): PlaceCategory | null {
  if (tags.amenity === 'restaurant') return 'restaurant'
  if (tags.amenity === 'cafe') return 'cafe'
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'museum'
  if (tags.tourism === 'viewpoint') return 'viewpoint'
  if (tags.historic) return 'history'
  if (tags.leisure === 'park' || tags.tourism === 'zoo' || tags.tourism === 'aquarium') return 'park'
  if (tags.tourism) return 'attraction'
  return null
}

function addressOf(tags: Record<string, string>): string | undefined {
  if (tags['addr:full']) return tags['addr:full']
  const parts = [tags['addr:city'], tags['addr:street'], tags['addr:housenumber']].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : undefined
}

/**
 * Overpass 응답 → 화면용 장소 목록 (TODO 2-3, 2-4).
 * 같은 이름은 하나만 남기고, 위키 문서가 있는(널리 알려진) 장소를 먼저, 그다음 가까운 순으로 정렬한다.
 */
export type OverpassResponse = { elements?: RawElement[] }

export function parsePlaces(raw: OverpassResponse, city: City, limit = 60): Place[] {
  const seen = new Set<string>()
  const places: Place[] = []
  for (const el of raw.elements ?? []) {
    const tags = el.tags ?? {}
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    const category = categoryOf(tags)
    const local = tags.name?.trim()
    if (lat === undefined || lon === undefined || !category || !local) continue
    const name = tags['name:ko']?.trim() || tags['name:en']?.trim() || local
    if (seen.has(name)) continue
    seen.add(name)
    places.push({
      id: `${el.type}-${el.id}`,
      name,
      localName: name !== local ? local : undefined,
      category,
      lat,
      lon,
      distanceKm: Math.round(distanceKm(city.lat, city.lon, lat, lon) * 10) / 10,
      // 같은 음식 종류가 "Soba"·"soba"처럼 섞여 있어 소문자로 맞춘다
      cuisine: tags.cuisine ? [...new Set(tags.cuisine.split(';').map((c) => c.trim().toLowerCase()).filter(Boolean))] : [],
      address: addressOf(tags),
      openingHours: tags.opening_hours,
      website: tags.website ?? tags['contact:website'],
      description: tags['description:ko'] ?? tags.description,
      wikipedia: tags.wikipedia,
      osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    })
  }
  const known = (p: Place) => (p.wikipedia ? 0 : 1)
  return places.sort((a, b) => known(a) - known(b) || a.distanceKm - b.distanceKm).slice(0, limit)
}

/** 서버를 차례로 시도한다. 모두 실패하면 마지막 오류를 던진다. */
export async function queryOverpass<T>(
  query: string,
  servers = OVERPASS_SERVERS,
  request: (url: string, init: RequestInit, timeoutMs: number) => Promise<T> = fetchJson<T>,
): Promise<T> {
  let lastError: unknown
  for (const server of servers) {
    try {
      // 공개 서버는 붐비면 30초 넘게 걸리기도 해서(실측 24~51초) 서버마다 60초까지 기다린다
      return await request(server, { method: 'POST', body: new URLSearchParams({ data: query }) }, 60000)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

export interface PlacesResult {
  places: Place[]
  /** 미리 받아 둔 데이터면 받은 날짜, 실시간이면 없음 */
  snapshotDate?: string
}

type Snapshot = { fetchedAt: string; places: Place[] }

/**
 * 인기 도시 20곳은 미리 받아 둔 데이터(src/data/places, `npm run places:update`)를 쓴다 (TODO 9-1).
 * 공개 Overpass 서버는 한 번에 25~60초가 걸려서, 인기 도시는 서버를 기다리지 않게 한다. 파일은 필요할 때만 불러온다.
 */
const SNAPSHOTS = import.meta.glob<Snapshot>('../../data/places/*.json', { import: 'default' })

export async function loadSnapshot(cityId: string, kind: PlaceKind, files = SNAPSHOTS): Promise<Snapshot | null> {
  const load = files[`../../data/places/${cityId}-${kind}.json`]
  return load ? load() : null
}

/** 같은 도시·종류를 동시에 여러 번 요청하면(미리 불러오기 + 탭) 한 번만 보낸다 */
const inFlight = new Map<string, Promise<PlacesResult>>()

export function loadPlacesResult(city: City, kind: PlaceKind): Promise<PlacesResult> {
  const key = `${kind}:${city.id}:${city.lat},${city.lon}`
  const running = inFlight.get(key)
  if (running) return running
  const job = (async (): Promise<PlacesResult> => {
    const snapshot = await loadSnapshot(city.id, kind)
    if (snapshot) return { places: snapshot.places, snapshotDate: snapshot.fetchedAt }
    const places = await cached(`osm:${key}`, async () => parsePlaces(await queryOverpass<OverpassResponse>(buildQuery(city, kind)), city))
    return { places }
  })().finally(() => inFlight.delete(key))
  inFlight.set(key, job)
  return job
}

/** 도시의 명소 또는 식당 (인기 도시는 미리 받은 데이터, 그 밖은 실시간 + 하루 캐시) */
export async function loadPlaces(city: City, kind: PlaceKind): Promise<Place[]> {
  return (await loadPlacesResult(city, kind)).places
}

/** 도시 화면을 열자마자 명소·식당을 미리 불러 둔다(결과는 캐시에 남음). 실패는 탭을 열 때 다시 보여준다. */
export function prefetchPlaces(city: City): void {
  for (const kind of ['sights', 'food'] as PlaceKind[]) void loadPlacesResult(city, kind).catch(() => {})
}

/** 식당 목록에서 많이 나오는 음식 종류 (필터 칩용) */
export function topCuisines(places: Place[], max = 6): string[] {
  const counts = new Map<string, number>()
  for (const p of places) for (const c of p.cuisine) counts.set(c, (counts.get(c) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([c]) => c)
}
