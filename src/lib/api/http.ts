import { defaultStore, type KeyValueStore } from '../storage'

/** 위키미디어 정책: 브라우저에서는 User-Agent 대신 Api-User-Agent로 앱을 알린다 */
export const APP_AGENT = 'TripReady/1.0 (https://github.com/hyeeun-hub/trip-ready)'

export class HttpError extends Error {
  readonly status: number
  constructor(status: number, url: string) {
    super(`HTTP ${status}: ${url}`)
    this.status = status
  }
}

/** JSON 요청. 시간 초과(기본 20초)와 HTTP 오류를 Error로 바꾼다. */
export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) throw new HttpError(res.status, url)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

const CACHE_PREFIX = 'tripready:cache:'
export const DAY_MS = 24 * 60 * 60 * 1000

/** 응답 캐시 (API 이용 정책: 같은 요청을 반복하지 않는다). 기본 하루. */
export async function cached<T>(
  key: string,
  load: () => Promise<T>,
  { ttlMs = DAY_MS, store = defaultStore(), now = Date.now }: { ttlMs?: number; store?: KeyValueStore | null; now?: () => number } = {},
): Promise<T> {
  const fullKey = CACHE_PREFIX + key
  try {
    const raw = store?.getItem(fullKey)
    if (raw) {
      const entry = JSON.parse(raw) as { savedAt: number; value: T }
      if (now() - entry.savedAt < ttlMs) return entry.value
    }
  } catch {
    // 깨진 캐시는 무시하고 새로 받는다
  }
  const value = await load()
  try {
    store?.setItem(fullKey, JSON.stringify({ savedAt: now(), value }))
  } catch {
    // 저장 공간이 부족하면 캐시 없이 쓴다
  }
  return value
}

/** 두 좌표 사이 거리(km) */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const h =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
