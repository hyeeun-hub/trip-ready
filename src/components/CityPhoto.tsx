import { imageCreditUrl, loadCitySummary, sizedImageUrl } from '../lib/api/wikipedia'
import { cityGradient } from '../lib/cities'
import { useAsync } from '../lib/useAsync'
import type { City } from '../types'

interface Props {
  city: City
  className: string
  /** 사진 너비: 작은 카드 500px, 큰 카드 960px, 화면 위쪽 큰 사진 1280px (TODO 7-3) */
  width?: 500 | 960 | 1280
  /** 사진 출처 링크를 사진 위에 표시 */
  credit?: boolean
}

/** 도시 사진: 위키백과 대표 사진(고화질), 없거나 불러오는 중이면 도시별 기본 색 */
export function CityPhoto({ city, className, width = 500, credit = false }: Props) {
  const summary = useAsync(`summary:${city.id}`, () => loadCitySummary(city))
  const data = summary.status === 'done' ? summary.data : null
  const image = data ? sizedImageUrl(data, width) : undefined
  const creditUrl = credit && data ? imageCreditUrl(data) : undefined
  return (
    <span
      className={className}
      style={{
        background: image ? `center / cover no-repeat url("${image}")` : cityGradient(city.id),
      }}
    >
      <span className="city-photo-label">{city.nameEn}</span>
      {creditUrl && (
        <a className="photo-credit" href={creditUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          ⓒ 위키미디어
        </a>
      )}
    </span>
  )
}
