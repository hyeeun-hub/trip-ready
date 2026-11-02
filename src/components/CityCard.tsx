import { rememberCity } from '../lib/cityRegistry'
import { href } from '../lib/router'
import type { City } from '../types'
import { CityPhoto } from './CityPhoto'

interface Props {
  city: City
  size?: 'large' | 'small'
}

/** 도시 사진 카드 (사진: 위키백과 대표 이미지) */
export function CityCard({ city, size = 'small' }: Props) {
  return (
    <a
      className={`city-card ${size}`}
      aria-label={`${city.name} (${city.country})`}
      href={href({ page: 'city', cityId: city.id, tab: 'about' })}
      onClick={() => rememberCity(city)}
    >
      <CityPhoto city={city} className="city-photo" width={size === 'large' ? 960 : 500} />
      <span className="city-name">
        {city.country && <span className="accent">[{city.country}]</span>}
        {city.name}
      </span>
    </a>
  )
}
