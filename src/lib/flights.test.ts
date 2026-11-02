import { describe, expect, it } from 'vitest'
import { POPULAR_CITIES } from '../data/cities'
import type { City } from '../types'
import { flightLinks } from './flights'

const tokyo = POPULAR_CITIES.find((c) => c.id === 'tokyo') as City
const searched: City = { ...tokyo, id: 'osm-relation-1', name: '교토시', nameEn: 'Kyoto', airports: [] }

describe('항공권 검색 링크 (2-5)', () => {
  it('인기 도시는 첫 공항 코드로, 날짜·인원을 채운다', () => {
    const [google, sky] = flightLinks({ originIata: 'ICN', city: tokyo, departDate: '2026-12-20', returnDate: '2026-12-23', travelers: 2 })
    expect(new URL(google.url).searchParams.get('q')).toBe('Flights to NRT from ICN on 2026-12-20 through 2026-12-23 for 2 adults')
    expect(sky.url).toBe('https://www.skyscanner.co.kr/transport/flights/icn/nrt/261220/261223/?adultsv2=2')
  })

  it('검색 도시는 공항 코드가 없어 구글 항공권만, 도시 영어 이름으로 찾는다', () => {
    const links = flightLinks({ originIata: 'GMP', city: searched })
    expect(links).toHaveLength(1)
    expect(new URL(links[0].url).searchParams.get('q')).toBe('Flights to Kyoto from GMP')
  })

  it('날짜가 없으면 날짜 없이 연다 (1명)', () => {
    const [, sky] = flightLinks({ originIata: 'ICN', city: tokyo })
    expect(sky.url).toBe('https://www.skyscanner.co.kr/transport/flights/icn/nrt/?adultsv2=1')
  })
})
