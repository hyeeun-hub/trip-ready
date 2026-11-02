import { afterEach, describe, expect, it, vi } from 'vitest'
import { isISODate } from '../lib/date'
import { loadPlacesResult, loadSnapshot, type Place } from '../lib/api/overpass'
import { findPlaceAnywhere } from '../lib/cityRegistry'
import type { City } from '../types'
import { POPULAR_CITIES } from './cities'

const files = import.meta.glob<{ fetchedAt: string; places: Place[] }>('./places/*.json', { eager: true, import: 'default' })

describe('미리 받아 둔 인기 도시 장소 (9-1)', () => {
  it('파일 이름이 인기 도시 id-종류이고, 날짜·장소 형식이 맞다', () => {
    const ids = new Set(POPULAR_CITIES.map((c) => c.id))
    // 인기 도시 20곳 × 명소·식당
    expect(Object.keys(files)).toHaveLength(POPULAR_CITIES.length * 2)
    for (const [path, data] of Object.entries(files)) {
      const match = /\/([a-z]+)-(sights|food)\.json$/.exec(path)
      expect(match, path).not.toBeNull()
      expect(ids.has(match![1]), path).toBe(true)
      expect(isISODate(data.fetchedAt), path).toBe(true)
      expect(data.places.length, path).toBeLessThanOrEqual(60)
      for (const p of data.places) {
        expect(p.id && p.name && p.osmUrl, `${path} ${p.id}`).toBeTruthy()
        expect(Number.isFinite(p.lat) && Number.isFinite(p.lon)).toBe(true)
      }
    }
  })

  it('있는 파일만 불러오고, 없으면 null (검색 도시는 실시간으로)', async () => {
    const fake = { '../../data/places/tokyo-sights.json': async () => ({ fetchedAt: '2026-11-02', places: [] }) }
    expect(await loadSnapshot('tokyo', 'sights', fake)).toEqual({ fetchedAt: '2026-11-02', places: [] })
    expect(await loadSnapshot('osm-relation-1', 'sights', fake)).toBeNull()
  })

  it('새로고침한 장소 주소도 미리 받은 데이터에서 찾는다', async () => {
    const tokyo = files['./places/tokyo-sights.json']
    const first = tokyo.places[0]
    expect((await findPlaceAnywhere('tokyo', first.id, []))?.name).toBe(first.name)
    expect(await findPlaceAnywhere('tokyo', 'node-0', [])).toBeUndefined()
  })
})

describe('검색 도시 장소 불러오기 (9-2)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('같은 도시·종류를 동시에 부르면 요청은 한 번만 보낸다', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ elements: [] })))
    vi.stubGlobal('fetch', fetchMock)
    const city: City = { ...POPULAR_CITIES[0], id: 'osm-relation-1', region: '검색' }
    const [a, b] = await Promise.all([loadPlacesResult(city, 'food'), loadPlacesResult(city, 'food')])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
    expect(a.snapshotDate).toBeUndefined()
  })

  it('인기 도시는 서버에 요청하지 않고 미리 받은 데이터와 기준일을 쓴다', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await loadPlacesResult(POPULAR_CITIES[0], 'sights')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.snapshotDate).toBe(files[`./places/${POPULAR_CITIES[0].id}-sights.json`].fetchedAt)
  })
})
