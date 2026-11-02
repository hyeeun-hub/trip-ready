import { useState, type FormEvent } from 'react'
import { addItem, progress, removeItem, toggleItem } from '../lib/checklist'
import type { ChecklistItem } from '../types'

interface Props {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

/** 준비 체크리스트 (TODO 1-5) */
export function Checklist({ items, onChange }: Props) {
  const [title, setTitle] = useState('')
  const percent = progress(items)

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    onChange(addItem(items, title))
    setTitle('')
  }

  return (
    <section className="card">
      <div className="card-head">
        <h3>준비 체크리스트</h3>
        <span className="badge">{percent}%</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <ul className="check-list">
        {items.map((item) => (
          <li key={item.id}>
            <label className={item.done ? 'check done' : 'check'}>
              <input type="checkbox" checked={item.done} onChange={() => onChange(toggleItem(items, item.id))} />
              {item.title}
            </label>
            {item.custom && (
              <button type="button" className="text-button" onClick={() => onChange(removeItem(items, item.id))}>
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={handleAdd}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="준비할 것 추가" aria-label="준비할 것 추가" />
        <button type="submit" className="secondary">
          추가
        </button>
      </form>
    </section>
  )
}
