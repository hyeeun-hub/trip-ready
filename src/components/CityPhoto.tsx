import { loadCitySummary } from '../lib/api/wikipedia'
import { cityGradient } from '../lib/cities'
import { useAsync } from '../lib/useAsync'
import type { City } from '../types'

interface Props {
  city: City
  className: string
}

/** 도시 사진: 위키백과 대표 이미지, 없거나 불러오는 중이면 도시별 기본 색 */
export function CityPhoto({ city, className }: Props) {
  const summary = useAsync(`summary:${city.id}`, () => loadCitySummary(city))
  const image = summary.status === 'done' ? summary.data?.imageUrl : undefined
  return (
    <span
      className={className}
      style={{
        background: image ? `center / cover no-repeat url("${image}")` : cityGradient(city.id),
      }}
    >
      <span className="city-photo-label">{city.nameEn}</span>
    </span>
  )
}
