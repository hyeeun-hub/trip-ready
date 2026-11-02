import { useState, type FormEvent } from 'react'
import { POPULAR_CITIES, REGIONS } from '../data/cities'
import { progress } from '../lib/checklist'
import { searchCities } from '../lib/api/nominatim'
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
  const [search, setSearch] = useState<{ query: string; status: 'loading' | 'done' | 'error'; results: City[] } | null>(null)
  const cities = filterCities(POPULAR_CITIES, query, region)
  const { upcoming, past } = splitTrips(trips, today)

  /** 인기 도시 하나와 딱 맞으면 바로 열고, 아니면 오픈스트리트맵에서 도시를 검색한다 (TODO 2-1) */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (cities.length === 1) {
      onSelectCity(cities[0])
      return
    }
    setSearch({ query: q, status: 'loading', results: [] })
    try {
      const results = await searchCities(q)
      setSearch({ query: q, status: 'done', results })
    } catch {
      setSearch({ query: q, status: 'error', results: [] })
    }
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

      <p className="hint">인기 도시는 바로 고를 수 있고, 그 밖의 도시는 이름을 입력하고 검색을 눌러요.</p>

      {search && (
        <section className="section">
          <h2 className="section-title">"{search.query}" 검색 결과</h2>
          {search.status === 'loading' && (
            <p className="status" role="status">
              <span className="spinner" aria-hidden /> 도시를 찾는 중이에요.
            </p>
          )}
          {search.status === 'error' && (
            <p className="status error" role="alert">
              검색하지 못했어요. 잠시 뒤 다시 눌러 주세요.
            </p>
          )}
          {search.status === 'done' && search.results.length === 0 && (
            <p className="muted">찾는 도시가 없어요. 영어 이름(예: Kyoto)으로도 찾아보세요.</p>
          )}
          {search.results.length > 0 && (
            <ul className="trip-list">
              {search.results.map((c) => (
                <li key={c.id}>
                  <button type="button" className="trip-row" onClick={() => onSelectCity(c)}>
                    <span className="trip-row-main">
                      <span className="trip-row-title">{c.name}</span>
                      <span className="muted">{[c.country, c.nameEn].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="trip-row-side">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="source">
            도시 검색: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap 기여자</a> (Nominatim)
          </p>
        </section>
      )}

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
          <p className="muted">인기 도시 중에는 "{query}"가 없어요. 검색을 눌러 다른 도시를 찾아보세요.</p>
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
