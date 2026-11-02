import { useEffect, useState, type FormEvent } from 'react'
import { POPULAR_CITIES, REGIONS } from '../data/cities'
import { searchCities } from '../lib/api/nominatim'
import { filterCities } from '../lib/cities'
import { rememberCity } from '../lib/cityRegistry'
import { href, navigate } from '../lib/router'
import type { City } from '../types'
import { CityCard } from './CityCard'

type SearchState = { query: string; status: 'loading' | 'done' | 'error'; results: City[] }

/** 여행지: 검색·지역 칩·도시 목록 (TODO 1-3, 2-1) */
export function ExplorePage({ query: initialQuery }: { query?: string }) {
  const initial = initialQuery?.trim() ?? ''
  const initialMatches = initial ? filterCities(POPULAR_CITIES, initial, null) : []
  const [query, setQuery] = useState(initial)
  const [region, setRegion] = useState<string | null>(null)
  // 홈에서 넘어온 검색어가 인기 도시에 없으면 바로 도시 검색을 시작한다
  const [search, setSearch] = useState<SearchState | null>(() =>
    initial && initialMatches.length === 0 ? { query: initial, status: 'loading', results: [] } : null,
  )
  const cities = filterCities(POPULAR_CITIES, search ? '' : query, region)

  async function runSearch(q: string) {
    setSearch({ query: q, status: 'loading', results: [] })
    try {
      setSearch({ query: q, status: 'done', results: await searchCities(q) })
    } catch {
      setSearch({ query: q, status: 'error', results: [] })
    }
  }

  useEffect(() => {
    if (!initial) return
    const matches = filterCities(POPULAR_CITIES, initial, null)
    if (matches.length === 1) {
      navigate({ page: 'city', cityId: matches[0].id, tab: 'about' })
      return
    }
    if (matches.length > 0) return
    let alive = true
    searchCities(initial).then(
      (results) => alive && setSearch({ query: initial, status: 'done', results }),
      () => alive && setSearch({ query: initial, status: 'error', results: [] }),
    )
    return () => {
      alive = false
    }
  }, [initial])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const matches = filterCities(POPULAR_CITIES, q, null)
    if (matches.length === 1) navigate({ page: 'city', cityId: matches[0].id, tab: 'about' })
    else void runSearch(q)
  }

  return (
    <div className="container">
      <h1 className="page-title">여행지</h1>
      <form className="search" role="search" onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearch(null)
          }}
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
      <p className="hint">인기 도시는 바로 골라요. 그 밖의 도시는 이름을 입력하고 검색을 눌러요.</p>

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
                  <a className="trip-row" href={href({ page: 'city', cityId: c.id, tab: 'about' })} onClick={() => rememberCity(c)}>
                    <span className="trip-row-main">
                      <span className="trip-row-title">{c.name}</span>
                      <span className="muted">{[c.country, c.nameEn].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span>›</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="source">
            도시 검색: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap 기여자</a> (Nominatim)
          </p>
        </section>
      )}

      <div className="chip-grid" role="group" aria-label="지역">
        {REGIONS.map((r) => (
          <button key={r} type="button" className={region === r ? 'chip active' : 'chip'} aria-pressed={region === r} onClick={() => setRegion(region === r ? null : r)}>
            {r}
          </button>
        ))}
      </div>

      <section className="section">
        <h2 className="section-title">{region ?? '인기'} 도시</h2>
        {cities.length === 0 ? (
          <p className="muted">인기 도시 중에는 "{query}"가 없어요. 검색을 눌러 다른 도시를 찾아보세요.</p>
        ) : (
          <div className="card-grid wide">
            {cities.map((c) => (
              <CityCard key={c.id} city={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
