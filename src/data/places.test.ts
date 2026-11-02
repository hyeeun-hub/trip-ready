import { describe, expect, it } from 'vitest'
import { isISODate } from '../lib/date'
import { loadSnapshot, type Place } from '../lib/api/overpass'
import { findPlaceAnywhere } from '../lib/cityRegistry'
import { POPULAR_CITIES } from './cities'

const files = import.meta.glob<{ fetchedAt: string; places: Place[] }>('./places/*.json', { eager: true, import: 'default' })

describe('미리 받아 둔 인기 도시 장소 (9-1)', () => {
  it('파일 이름이 인기 도시 id-종류이고, 날짜·장소 형식이 맞다', () => {
    const ids = new Set(POPULAR_CITIES.map((c) => c.id))
    expect(Object.keys(files).length).toBeGreaterThan(0)
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
