import type { City } from '../types'

/** 인기 도시를 이름(한국어·영어·나라)으로 거른다. 입력이 비면 전체. */
export function filterCities(cities: City[], query: string, region: string | null): City[] {
  const q = query.trim().toLowerCase()
  return cities.filter(
    (c) =>
      (!region || c.region === region) &&
      (!q || [c.name, c.nameEn, c.country].some((v) => v.toLowerCase().includes(q))),
  )
}

/** 사진이 없을 때 쓰는 도시별 그라데이션 (id로 고정된 색) */
export function cityGradient(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const hue = hash % 360
  return `linear-gradient(135deg, hsl(${hue} 70% 72%), hsl(${(hue + 40) % 360} 65% 58%))`
}
