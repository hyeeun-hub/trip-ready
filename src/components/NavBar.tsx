import { href, type Route } from '../lib/router'

const LINKS: { label: string; route: Route; match: Route['page'][] }[] = [
  { label: '홈', route: { page: 'home' }, match: ['home'] },
  { label: '여행지', route: { page: 'explore' }, match: ['explore', 'city', 'place'] },
  { label: '내 여행', route: { page: 'trips' }, match: ['trips', 'trip'] },
]

/** 위쪽 고정 메뉴: 로고, 페이지 링크, 여행 만들기 버튼 */
export function NavBar({ current }: { current: Route }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a className="logo" href={href({ page: 'home' })}>
          <span aria-hidden>✈️</span> TripReady
        </a>
        <nav className="nav-links" aria-label="메뉴">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={href(l.route)}
              className={l.match.includes(current.page) ? 'active' : ''}
              aria-current={l.match.includes(current.page) ? 'page' : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a className="nav-cta" href={href({ page: 'new' })}>
          여행 만들기
        </a>
      </div>
    </header>
  )
}
