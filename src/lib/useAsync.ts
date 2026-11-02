import { useEffect, useRef, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: T }

/**
 * key가 바뀌면 load를 다시 부른다. retry()로 같은 key를 다시 불러온다.
 * 결과는 Promise가 끝난 뒤에만 setState 한다(이펙트 안에서 바로 setState 하지 않음).
 */
export function useAsync<T>(key: string | null, load: () => Promise<T>): AsyncState<T> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ requestKey: string; state: AsyncState<T> } | null>(null)
  const loadRef = useRef(load)
  const requestKey = key === null ? null : `${key}#${attempt}`

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    if (requestKey === null) return
    let alive = true
    loadRef.current().then(
      (data) => alive && setResult({ requestKey, state: { status: 'done', data } }),
      (e: unknown) =>
        alive && setResult({ requestKey, state: { status: 'error', message: e instanceof Error ? e.message : String(e) } }),
    )
    return () => {
      alive = false
    }
  }, [requestKey])

  const state: AsyncState<T> = result && result.requestKey === requestKey ? result.state : { status: 'loading' }
  return { ...state, retry: () => setAttempt((n) => n + 1) }
}
