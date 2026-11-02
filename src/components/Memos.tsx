import { useState, type FormEvent } from 'react'
import type { TripMemo } from '../types'

interface Props {
  memos: TripMemo[]
  defaultDate: string
  onAdd: (date: string, text: string) => void
  onRemove: (id: string) => void
}

/** 여행 메모: 날짜별 한 줄 기록 (TODO 1-6) */
export function Memos({ memos, defaultDate, onAdd, onRemove }: Props) {
  const [date, setDate] = useState(defaultDate)
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onAdd(date, text)
    setText('')
  }

  return (
    <section className="card">
      <h3>여행 메모</h3>
      {memos.length === 0 ? (
        <p className="muted">아직 메모가 없어요. 여행 중·후에 한 줄씩 남겨 보세요.</p>
      ) : (
        <ul className="memo-list">
          {memos.map((m) => (
            <li key={m.id}>
              <span className="memo-date">{m.date}</span>
              <span className="memo-text">{m.text}</span>
              <button type="button" className="text-button" onClick={() => onRemove(m.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="메모 날짜" />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="한 줄 기록" aria-label="한 줄 기록" />
        <button type="submit" className="secondary">
          남기기
        </button>
      </form>
    </section>
  )
}
