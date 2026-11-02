import { useState, type FormEvent } from 'react'
import { POPULAR_CITIES, REGIONS } from '../data/cities'
import { progress } from '../lib/checklist'
import { filterCities } from '../lib/cities'
import { dDayLabel, splitTrips } from '../lib/trips'
import type { City, Trip } from '../types'
import { CityCard } from './CityCard'

interface Props {
  trips: Trip[]
  today: string
  onSelectCity: (city: City) => void
  onOpenTrip: (id: string) => void
}

function TripRow({ trip, today, onOpen }: { trip: Trip; today: string; onOpen: () => void }) {
  return (
    <li>
      <button type="button" className="trip-row" onClick={onOpen}>
        <span className="trip-row-main">
          <span className="trip-row-title">
            <span className="accent">[{trip.city.country}]</span>
            {trip.city.name}
          </span>
          <span className="muted">
            {trip.departDate} ~ {trip.returnDate} · {trip.travelers}명
          </span>
        </span>
        <span className="trip-row-side">
          <span className="badge">{dDayLabel(today, trip)}</span>
          <span className="muted">준비 {progress(trip.checklist)}%</span>
        </span>
      </button>
    </li>
  )
}

/** 첫 화면: 검색창, 인기 도시, 지역 칩, 내 여행 (TODO 1-3) */
export function Home({ trips, today, onSelectCity, onOpenTrip }: Props) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<string | null>(null)
  const cities = filterCities(POPULAR_CITIES, query, region)
  const { upcoming, past } = splitTrips(trips, today)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (cities.length === 1) onSelectCity(cities[0])
  }

  return (
    <div className="page">
      <p className="brand">TripReady</p>
      <h1 className="hero-title">어디로 떠날까요?</h1>
      <form className="search" role="search" onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="도시 이름을 찾아보세요."
          aria-label="도시 이름"
        />
        <button type="submit" aria-label="검색">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </form>

      {upcoming.length > 0 && (
        <section className="section">
          <h2 className="section-title">다가오는 여행</h2>
          <ul className="trip-list">
            {upcoming.map((t) => (
              <TripRow key={t.id} trip={t} today={today} onOpen={() => onOpenTrip(t.id)} />
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">인기 도시</h2>
        {cities.length === 0 ? (
          <p className="muted">인기 도시 중에는 "{query}"가 없어요.</p>
        ) : (
          <div className="carousel">
            {cities.map((c) => (
              <CityCard key={c.id} city={c} size="large" onSelect={onSelectCity} />
            ))}
          </div>
        )}
      </section>

      <div className="chip-grid" role="group" aria-label="지역">
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            className={region === r ? 'chip active' : 'chip'}
            aria-pressed={region === r}
            onClick={() => setRegion(region === r ? null : r)}
          >
            {r}
          </button>
        ))}
      </div>

      <section className="section">
        <h2 className="section-title">{region ?? '전체'} 도시</h2>
        <div className="card-grid">
          {cities.map((c) => (
            <CityCard key={c.id} city={c} onSelect={onSelectCity} />
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section className="section">
          <h2 className="section-title">다녀온 여행</h2>
          <ul className="trip-list">
            {past.map((t) => (
              <TripRow key={t.id} trip={t} today={today} onOpen={() => onOpenTrip(t.id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
