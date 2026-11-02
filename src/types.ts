/** 날짜는 모두 'YYYY-MM-DD' 문자열로 다룬다. */
export type ISODate = string

export interface Airport {
  /** IATA 공항 코드 */
  iata: string
  name: string
  /** 확인한 위키데이터 항목 */
  source: string
}

/** 여행 도시 (PRD F1). 인기 도시는 미리 넣어 둔 값, 검색 도시는 Nominatim 결과로 만든다. */
export interface City {
  id: string
  name: string
  nameEn: string
  country: string
  /** 인기 도시를 거르는 지역 묶음 (검색 도시는 '검색') */
  region: string
  lat: number
  lon: number
  /** 명소·식당을 찾을 반경(km) */
  radiusKm: number
  /** 한국어 위키백과 문서명 (없으면 영어 이름으로 찾는다) */
  wikiTitle?: string
  /** 항공권 검색에 쓸 공항. 비어 있으면 도시 이름으로 검색한다 */
  airports: Airport[]
  /** 이 도시 정보를 확인한 출처 */
  source: string
}

export interface ChecklistItem {
  id: string
  title: string
  done: boolean
  /** 기본 항목인지(지울 수 없음) 직접 추가한 항목인지 */
  custom: boolean
}

export interface TripMemo {
  id: string
  date: ISODate
  text: string
}

/** 여행 (PRD F1, F5) */
export interface Trip {
  id: string
  city: City
  /** 출발 도시 (기본: 서울) */
  originName: string
  originIata: string
  departDate: ISODate
  returnDate: ISODate
  travelers: number
  checklist: ChecklistItem[]
  memos: TripMemo[]
  createdAt: string
}

export type NewTrip = Pick<Trip, 'city' | 'originName' | 'originIata' | 'departDate' | 'returnDate' | 'travelers'>
