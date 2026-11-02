import type { City } from '../types'
import { CityPhoto } from './CityPhoto'

interface Props {
  city: City
  size?: 'large' | 'small'
  onSelect: (city: City) => void
}

/** 도시 사진 카드 (사진: 위키백과 대표 이미지) */
export function CityCard({ city, size = 'small', onSelect }: Props) {
  return (
    <button type="button" className={`city-card ${size}`} aria-label={`${city.name} (${city.country})`} onClick={() => onSelect(city)}>
      <CityPhoto city={city} className="city-photo" />
      <span className="city-name">
        {city.country && <span className="accent">[{city.country}]</span>}
        {city.name}
      </span>
    </button>
  )
}
