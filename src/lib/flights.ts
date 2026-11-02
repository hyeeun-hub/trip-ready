import type { City } from '../types'

export interface FlightLink {
  label: string
  url: string
}

interface FlightQuery {
  originIata: string
  city: City
  departDate?: string
  returnDate?: string
  travelers?: number
}

/** yyyy-mm-dd → yymmdd (스카이스캐너 주소 형식) */
function yymmdd(date: string): string {
  return date.slice(2).replaceAll('-', '')
}

/**
 * 항공권 검색 링크 (TODO 2-5). 가격은 가져오지 않고 검색 사이트로 보낸다.
 * - 구글 항공권: 문장형 검색어(q)를 쓰므로 공항 코드가 없으면 도시 영어 이름으로 찾는다.
 * - 스카이스캐너: 공항 코드가 있는 도시만 (첫 번째 공항)
 */
export function flightLinks({ originIata, city, departDate, returnDate, travelers = 1 }: FlightQuery): FlightLink[] {
  const to = city.airports[0]?.iata ?? city.nameEn
  const dates = departDate ? ` on ${departDate}${returnDate ? ` through ${returnDate}` : ''}` : ''
  const people = travelers > 1 ? ` for ${travelers} adults` : ''
  const links: FlightLink[] = [
    {
      label: '구글 항공권',
      url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights to ${to} from ${originIata}${dates}${people}`)}&hl=ko`,
    },
  ]
  const iata = city.airports[0]?.iata
  if (iata) {
    const path = departDate ? `/${yymmdd(departDate)}${returnDate ? `/${yymmdd(returnDate)}` : ''}` : ''
    links.push({
      label: '스카이스캐너',
      url: `https://www.skyscanner.co.kr/transport/flights/${originIata.toLowerCase()}/${iata.toLowerCase()}${path}/?adultsv2=${travelers}`,
    })
  }
  return links
}
