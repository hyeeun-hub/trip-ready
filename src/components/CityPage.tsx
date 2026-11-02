import { useState, type FormEvent } from 'react'
import { ORIGINS } from '../data/origins'
import { cityGradient } from '../lib/cities'
import { validateNewTrip } from '../lib/trips'
import type { City, NewTrip } from '../types'
import { Header } from './Header'

interface Props {
  city: City
  onBack: () => void
  onCreate: (trip: NewTrip) => void
}

/** 도시 화면: 2단계에서 소개·명소·식당이 들어오고, 지금은 여행 만들기 (TODO 1-3) */
export function CityPage({ city, onBack, onCreate }: Props) {
  const [origin, setOrigin] = useState(ORIGINS[0].iata)
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [errors, setErrors] = useState<string[]>([])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const from = ORIGINS.find((o) => o.iata === origin) ?? ORIGINS[0]
    const input: NewTrip = { city, originName: from.name, originIata: from.iata, departDate, returnDate, travelers }
    const found = validateNewTrip(input)
    setErrors(found)
    if (found.length === 0) onCreate(input)
  }

  return (
    <div>
      <Header title={city.name} onBack={onBack} />
      <div className="detail-photo" style={{ background: cityGradient(city.id) }}>
        <span className="city-photo-label">{city.nameEn}</span>
      </div>
      <div className="page">
        <h2 className="detail-title">{city.name}</h2>
        <p className="muted">
          {city.country} · {city.nameEn}
        </p>

        <form className="card form" onSubmit={handleSubmit}>
          <h3>여행 만들기</h3>
          <label>
            출발
            <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
              {ORIGINS.map((o) => (
                <option key={o.iata} value={o.iata}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <div className="row">
            <label>
              출국일
              <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
            </label>
            <label>
              귀국일
              <input type="date" value={returnDate} min={departDate || undefined} onChange={(e) => setReturnDate(e.target.value)} />
            </label>
          </div>
          <label>
            인원
            <input
              type="number"
              min={1}
              max={20}
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
            />
          </label>
          {errors.length > 0 && (
            <ul className="errors" role="alert">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          <button type="submit" className="primary">
            이 도시로 여행 만들기
          </button>
        </form>
      </div>
    </div>
  )
}
