import { CITY_INTROS } from '../data/cityIntros'
import type { City } from '../types'

/**
 * 도시 소개 2~3줄 (TODO 7-1).
 * 인기 도시는 직접 쓴 소개, 검색 도시는 검색 결과에 있는 나라·지역으로 한 줄을 만든다(사실을 지어내지 않음).
 */
export function cityIntro(city: City): string {
  const written = CITY_INTROS[city.id]
  if (written) return written
  const where = [city.country, city.area].filter(Boolean).join(' ')
  return where
    ? `${where}에 있는 도시예요. 명소·식당 탭에서 가 볼 만한 곳을 둘러보세요.`
    : '명소·식당 탭에서 가 볼 만한 곳을 둘러보세요.'
}
