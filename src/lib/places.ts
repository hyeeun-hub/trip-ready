import type { Place, PlaceCategory } from './api/overpass'

/** 음식 종류(오픈스트리트맵 cuisine 값) 한국어 표시. 목록에 없으면 원래 값을 쓴다. */
const CUISINE_LABELS: Record<string, string> = {
  korean: '한식',
  japanese: '일식',
  chinese: '중식',
  thai: '태국',
  vietnamese: '베트남',
  italian: '이탈리아',
  french: '프랑스',
  spanish: '스페인',
  american: '미국',
  indian: '인도',
  mexican: '멕시코',
  seafood: '해산물',
  noodle: '국수',
  ramen: '라멘',
  sushi: '스시',
  pizza: '피자',
  burger: '버거',
  coffee_shop: '커피',
  cake: '케이크',
  dessert: '디저트',
  bakery: '베이커리',
  asian: '아시아',
  regional: '향토 음식',
  local: '향토 음식',
  steak_house: '스테이크',
  barbecue: '바비큐',
  udon: '우동',
  soba: '소바',
  tea: '차',
  curry: '카레',
  yakiniku: '야키니쿠',
  tonkatsu: '돈가스',
  izakaya: '이자카야',
  tempura: '덴푸라',
  sandwich: '샌드위치',
  chicken: '치킨',
}

export function cuisineLabel(cuisine: string): string {
  return CUISINE_LABELS[cuisine] ?? cuisine.replaceAll('_', ' ')
}

export const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  attraction: '📍',
  museum: '🏛️',
  viewpoint: '🌄',
  history: '🏯',
  park: '🌳',
  restaurant: '🍽️',
  cafe: '☕',
}

/** 해시태그 칩 거르기: 'all' / 장소 종류 / 'cuisine:xxx' */
export function filterPlaces(places: Place[], filter: string): Place[] {
  if (filter === 'all') return places
  if (filter.startsWith('cuisine:')) {
    const c = filter.slice('cuisine:'.length)
    return places.filter((p) => p.cuisine.includes(c))
  }
  return places.filter((p) => p.category === filter)
}

/** 장소 상세의 한 줄 소개. 데이터에 있는 사실(종류·음식 종류·거리)만으로 만든다. */
export function placeTagline(place: Place, cityName: string, categoryLabel: string): string {
  const food = place.cuisine.length > 0 ? `${place.cuisine.map(cuisineLabel).join('·')} ` : ''
  return `${cityName} 중심에서 ${place.distanceKm}km 떨어진 ${food}${categoryLabel}`
}

/** 지도 링크: 오픈스트리트맵, 구글 지도(키 없는 검색 URL) */
export function mapLinks(place: Place): { label: string; url: string }[] {
  return [
    { label: '오픈스트리트맵', url: `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=18/${place.lat}/${place.lon}` },
    { label: '구글 지도', url: `https://www.google.com/maps/search/?api=1&query=${place.lat}%2C${place.lon}` },
  ]
}
