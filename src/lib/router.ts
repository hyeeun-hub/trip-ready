import { useEffect, useState } from 'react'

export type CityTab = 'about' | 'sights' | 'food' | 'map'
export type TripTab = 'overview' | 'saved' | 'budget' | 'prep' | 'journal' | 'explore'

/** 페이지 주소 (#/...). 서버 없이 GitHub Pages에서 동작하고, 브라우저 뒤로 가기가 된다. */
export type Route =
  | { page: 'home' }
  | { page: 'explore'; query?: string }
  | { page: 'city'; cityId: string; tab: CityTab }
  | { page: 'new'; cityId?: string }
  | { page: 'trips' }
  | { page: 'trip'; tripId: string; tab: TripTab }
  | { page: 'place'; cityId: string; placeId: string }

const CITY_TABS: CityTab[] = ['about', 'sights', 'food', 'map']
const TRIP_TABS: TripTab[] = ['overview', 'saved', 'budget', 'prep', 'journal', 'explore']

export function parseRoute(hash: string): Route {
  const [path, search = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent)
  // 메모 탭은 여행 기록 탭으로 합쳐졌다(8단계): 예전 주소 #/trip/x/memo 도 기록 탭으로 연다
  if (parts[0] === 'trip' && parts[2] === 'memo') parts[2] = 'journal'
  const params = new URLSearchParams(search)
  switch (parts[0]) {
    case 'explore':
      return { page: 'explore', query: params.get('q') ?? undefined }
    case 'city':
      if (!parts[1]) break
      return { page: 'city', cityId: parts[1], tab: CITY_TABS.includes(parts[2] as CityTab) ? (parts[2] as CityTab) : 'about' }
    case 'new':
      return { page: 'new', cityId: parts[1] }
    case 'trips':
      return { page: 'trips' }
    case 'trip':
      if (!parts[1]) break
      return { page: 'trip', tripId: parts[1], tab: TRIP_TABS.includes(parts[2] as TripTab) ? (parts[2] as TripTab) : 'overview' }
    case 'place':
      if (!parts[1] || !parts[2]) break
      return { page: 'place', cityId: parts[1], placeId: parts[2] }
  }
  return { page: 'home' }
}

export function href(route: Route): string {
  const e = encodeURIComponent
  switch (route.page) {
    case 'home':
      return '#/'
    case 'explore':
      return route.query ? `#/explore?q=${e(route.query)}` : '#/explore'
    case 'city':
      return `#/city/${e(route.cityId)}${route.tab === 'about' ? '' : `/${route.tab}`}`
    case 'new':
      return route.cityId ? `#/new/${e(route.cityId)}` : '#/new'
    case 'trips':
      return '#/trips'
    case 'trip':
      return `#/trip/${e(route.tripId)}${route.tab === 'overview' ? '' : `/${route.tab}`}`
    case 'place':
      return `#/place/${e(route.cityId)}/${e(route.placeId)}`
  }
}

export function navigate(route: Route): void {
  window.location.hash = href(route)
}

/** 현재 주소의 페이지. 주소가 바뀌면 다시 그리고 맨 위로 올린다. */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
