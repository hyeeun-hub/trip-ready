import { cityGradient } from '../lib/cities'
import type { City } from '../types'

interface Props {
  city: City
  size?: 'large' | 'small'
  onSelect: (city: City) => void
}

/** 도시 사진 카드. 사진은 2단계에서 위키백과 이미지로 채우고, 지금은 도시별 기본 색을 쓴다. */
export function CityCard({ city, size = 'small', onSelect }: Props) {
  return (
    <button type="button" className={`city-card ${size}`} aria-label={`${city.name} (${city.country})`} onClick={() => onSelect(city)}>
      <span className="city-photo" style={{ background: cityGradient(city.id) }}>
        <span className="city-photo-label">{city.nameEn}</span>
      </span>
      <span className="city-name">
        <span className="accent">[{city.country}]</span>
        {city.name}
      </span>
    </button>
  )
}
