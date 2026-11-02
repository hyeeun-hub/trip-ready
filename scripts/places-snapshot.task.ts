/**
 * 인기 도시 20곳의 명소·식당을 오픈스트리트맵(Overpass)에서 미리 받아 src/data/places/에 저장한다 (TODO 9-1).
 * 앱과 같은 질의(buildQuery)·변환(parsePlaces)을 쓰기 위해 Vitest로 실행한다. 일반 테스트(npm test)에는 들어가지 않는다.
 *
 *   npm run places:update            # 20곳 모두
 *   CITIES=tokyo,osaka npm run places:update
 *
 * Overpass 이용 정책: 앱을 알리는 User-Agent, 요청 사이 쉬기(하루 1만 회 한도에 한참 못 미침).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { it } from 'vitest'
import { POPULAR_CITIES } from '../src/data/cities'
import { buildQuery, OVERPASS_SERVERS, parsePlaces, queryOverpass, type OverpassResponse, type PlaceKind } from '../src/lib/api/overpass'
import { fetchJson } from '../src/lib/api/http'

const OUT = join(__dirname, '..', 'src', 'data', 'places')
const AGENT = 'TripReady-snapshot/1.0 (https://github.com/hyeeun-hub/trip-ready)'
const wanted = process.env.CITIES?.split(',').map((s) => s.trim())
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

it('인기 도시 장소 스냅숏 받기', async () => {
  mkdirSync(OUT, { recursive: true })
  const cities = POPULAR_CITIES.filter((c) => !wanted || wanted.includes(c.id))
  for (const city of cities) {
    for (const kind of ['sights', 'food'] as PlaceKind[]) {
      const started = Date.now()
      let lastError: unknown
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const raw = await queryOverpass<OverpassResponse>(buildQuery(city, kind), OVERPASS_SERVERS, (url, init, timeoutMs) =>
            fetchJson(url, { ...init, headers: { 'User-Agent': AGENT } }, timeoutMs * 2),
          )
          const places = parsePlaces(raw, city)
          const fetchedAt = new Date().toISOString().slice(0, 10)
          writeFileSync(join(OUT, `${city.id}-${kind}.json`), JSON.stringify({ fetchedAt, places }) + '\n')
          console.log(`${city.id} ${kind}: ${places.length}곳, ${Math.round((Date.now() - started) / 1000)}초`)
          lastError = undefined
          break
        } catch (e) {
          lastError = e
          console.log(`${city.id} ${kind}: ${attempt}번째 실패 (${String(e)}), 30초 뒤 다시`)
          await sleep(30_000)
        }
      }
      if (lastError) console.log(`${city.id} ${kind}: 건너뜀`)
      await sleep(5_000)
    }
  }
}, 3 * 60 * 60 * 1000)
