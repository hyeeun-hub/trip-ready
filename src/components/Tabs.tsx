import { href, type Route } from '../lib/router'

interface Props<T extends string> {
  tabs: { value: T; label: string; route: Route }[]
  current: T
}

/** 페이지 안 탭. 탭마다 주소가 달라 뒤로 가기·새로고침에도 같은 탭이 열린다. */
export function Tabs<T extends string>({ tabs, current }: Props<T>) {
  return (
    <nav className="page-tabs" aria-label="탭">
      {tabs.map((t) => (
        <a key={t.value} href={href(t.route)} className={t.value === current ? 'active' : ''} aria-current={t.value === current ? 'page' : undefined}>
          {t.label}
        </a>
      ))}
    </nav>
  )
}
