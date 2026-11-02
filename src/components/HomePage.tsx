import { useRef, useState, type FormEvent } from 'react'
import { POPULAR_CITIES } from '../data/cities'
import { href, navigate } from '../lib/router'
import { splitTrips } from '../lib/trips'
import type { Trip } from '../types'
import { CityCard } from './CityCard'
import { TripRow } from './TripRow'

interface Props {
  trips: Trip[]
  today: string
}

const STEPS = [
  { icon: '🔎', title: '여행지 고르기', text: '인기 도시 20곳을 고르거나 원하는 도시를 검색해요.', link: href({ page: 'explore' }) },
  { icon: '📌', title: '정보 모으고 저장하기', text: '소개·명소·식당·항공권을 한 번에 보고, 가고 싶은 곳을 저장해요.', link: href({ page: 'new' }) },
  { icon: '🧳', title: '준비하고 떠나기', text: '예산·준비물을 챙기고, 여행 중엔 사진으로 기록해요.', link: href({ page: 'trips' }) },
]

/** 홈: 히어로·인기 여행지·이렇게 준비해요·다가오는 여행 */
export function HomePage({ trips, today }: Props) {
  const [query, setQuery] = useState('')
  const carousel = useRef<HTMLDivElement>(null)
  const { upcoming } = splitTrips(trips, today)
  const next = upcoming[0]

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    navigate({ page: 'explore', query: query.trim() || undefined })
  }

  function scroll(direction: 1 | -1) {
    const el = carousel.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">여행 정보를 한곳에</p>
          <h1>어디로 떠날까요?</h1>
          <p className="hero-sub">도시를 고르면 소개·명소·식당·항공권 검색을 모아 드려요.</p>
          <form className="search" role="search" onSubmit={handleSubmit}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="도시 이름을 찾아보세요." aria-label="도시 이름" />
            <button type="submit" aria-label="검색">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>
          <div className="hero-actions">
            <a className="pill-button" href={href({ page: 'new' })}>
              여행 만들기
            </a>
            <a className="pill-button ghost" href={href({ page: 'explore' })}>
              여행지 둘러보기
            </a>
          </div>
        </div>
        <span className="hero-plane" aria-hidden>
          ✈️
        </span>
        {next && (
          <a className="hero-corner" href={href({ page: 'trip', tripId: next.id, tab: 'overview' })}>
            <span className="hero-corner-title">다가오는 여행 →</span>
            <span className="muted">
              {next.city.name} · {next.departDate}
            </span>
          </a>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">인기 여행지</h2>
            <p className="muted">사진을 눌러 도시 정보를 봐요.</p>
          </div>
          <div className="arrows">
            <button type="button" aria-label="이전 도시" onClick={() => scroll(-1)}>
              ‹
            </button>
            <button type="button" className="dark" aria-label="다음 도시" onClick={() => scroll(1)}>
              ›
            </button>
          </div>
        </div>
        <div className="carousel" ref={carousel}>
          {POPULAR_CITIES.map((c) => (
            <CityCard key={c.id} city={c} size="large" />
          ))}
        </div>
      </section>

      <section className="section steps-section">
        <h2 className="section-title center">이렇게 준비해요</h2>
        <p className="muted center">세 단계면 여행 준비가 한눈에 정리돼요.</p>
        <div className="steps">
          {STEPS.map((s, i) => (
            <a key={s.title} className={i === 1 ? 'step featured' : 'step'} href={s.link}>
              <span className="step-icon" aria-hidden>
                {s.icon}
              </span>
              <span className="step-no">{i + 1}단계</span>
              <span className="step-title">{s.title}</span>
              <span className="step-text">{s.text}</span>
              <span className="step-more">바로 가기 ›</span>
            </a>
          ))}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">다가오는 여행</h2>
            <a className="more-link" href={href({ page: 'trips' })}>
              전체 보기 ›
            </a>
          </div>
          <ul className="trip-list">
            {upcoming.slice(0, 3).map((t) => (
              <TripRow key={t.id} trip={t} today={today} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
