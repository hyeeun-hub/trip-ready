interface Props {
  title: string
  onBack: () => void
}

/** 상단 바: 뒤로가기 + 가운데 제목 */
export function Header({ title, onBack }: Props) {
  return (
    <header className="topbar">
      <button type="button" className="icon-button" aria-label="뒤로" onClick={onBack}>
        ‹
      </button>
      <h1 className="topbar-title">{title}</h1>
      <span className="icon-button" aria-hidden />
    </header>
  )
}
