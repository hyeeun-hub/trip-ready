/** 브라우저 뒤로 가기 */
export function BackLink({ label = '뒤로' }: { label?: string }) {
  return (
    <button type="button" className="back-link" onClick={() => history.back()}>
      ‹ {label}
    </button>
  )
}
