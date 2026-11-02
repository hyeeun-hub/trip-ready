import type { ReactNode } from 'react'
import type { AsyncState } from '../lib/useAsync'

interface Props<T> {
  state: AsyncState<T> & { retry: () => void }
  loading: string
  children: (data: T) => ReactNode
}

/** 불러오는 중 / 실패 + 다시 시도 / 결과 (TODO 2-6) */
export function AsyncView<T>({ state, loading, children }: Props<T>) {
  if (state.status === 'loading') {
    return (
      <p className="status" role="status">
        <span className="spinner" aria-hidden /> {loading}
      </p>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="status error" role="alert">
        불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.
        <button type="button" className="secondary" onClick={state.retry}>
          다시 시도
        </button>
      </div>
    )
  }
  return <>{children(state.data)}</>
}
