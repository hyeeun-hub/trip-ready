import { useState, type FormEvent } from 'react'
import { POPULAR_CITIES } from '../data/cities'
import { ORIGINS } from '../data/origins'
import { searchedCities } from '../lib/cityRegistry'
import { href } from '../lib/router'
import { validateNewTrip } from '../lib/trips'
import type { City, NewTrip } from '../types'
import { BackLink } from './BackLink'

interface Props {
  city?: City
  onCreate: (trip: NewTrip) => void
}

/** 여행 만들기 (TODO 1-3). 도시 화면에서 오면 그 도시가 골라져 있다. */
export function NewTripPage({ city: preset, onCreate }: Props) {
  const choices = [...POPULAR_CITIES, ...searchedCities()]
  const [cityId, setCityId] = useState(preset?.id ?? '')
  const [origin, setOrigin] = useState(ORIGINS[0].iata)
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [errors, setErrors] = useState<string[]>([])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const city = preset?.id === cityId ? preset : choices.find((c) => c.id === cityId)
    const from = ORIGINS.find((o) => o.iata === origin) ?? ORIGINS[0]
    const input: Partial<NewTrip> = { city, originName: from.name, originIata: from.iata, departDate, returnDate, travelers }
    const found = validateNewTrip(input)
    setErrors(found)
    if (found.length === 0 && city) onCreate({ ...input, city } as NewTrip)
  }

  return (
    <div className="container narrow">
      <BackLink />
      <h1 className="page-title">여행 만들기</h1>
      <form className="card form" onSubmit={handleSubmit}>
        <label>
          여행 도시
          <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
            <option value="">고르세요</option>
            {preset && !POPULAR_CITIES.some((c) => c.id === preset.id) && !searchedCities().some((c) => c.id === preset.id) && (
              <option value={preset.id}>{preset.name}</option>
            )}
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.country || '검색'})
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          목록에 없는 도시는 <a href={href({ page: 'explore' })}>여행지</a>에서 검색한 뒤 만들 수 있어요.
        </p>
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
          <input type="number" min={1} max={20} value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} />
        </label>
        {errors.length > 0 && (
          <ul className="errors" role="alert">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
        <button type="submit" className="primary">
          여행 만들기
        </button>
      </form>
    </div>
  )
}
