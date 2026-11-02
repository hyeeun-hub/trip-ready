import type { Place } from './lib/api/overpass'

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

/** 저장한 장소 (PRD F3). 장소 정보는 저장한 때의 값을 그대로 둔다(오프라인에서도 보이도록). */
export interface SavedPlace {
  place: Place
  memo: string
  /** 방문 예정일 (여행 기간 안) */
  visitDate?: ISODate
  savedAt: string
}

/** 예산 항목 (PRD F4) */
export type BudgetCategory = 'flight' | 'lodging' | 'food' | 'transport' | 'sights' | 'shopping' | 'other'

/** 예산 (원). 항목별 예산은 정하지 않아도 된다. */
export interface Budget {
  total: number
  byCategory: Partial<Record<BudgetCategory, number>>
}

export interface Expense {
  id: string
  date: ISODate
  category: BudgetCategory
  /** 원 단위 금액 (양의 정수) */
  amount: number
  memo: string
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
  /** 가고 싶은 곳 (3단계에서 추가, 예전 데이터에는 없을 수 있음) */
  savedPlaces?: SavedPlace[]
  /** 예산과 지출 (4단계에서 추가) */
  budget?: Budget
  expenses?: Expense[]
  createdAt: string
}

export type NewTrip = Pick<Trip, 'city' | 'originName' | 'originIata' | 'departDate' | 'returnDate' | 'travelers'>
