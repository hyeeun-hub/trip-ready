import { useState, type FormEvent } from 'react'
import {
  BUDGET_CATEGORIES,
  budgetOf,
  CATEGORY_NAMES,
  expensesOf,
  formatWon,
  parseWon,
  removeExpense,
  setCategoryBudget,
  setTotal,
  summarize,
  upsertExpense,
  validateExpense,
} from '../lib/budget'
import type { BudgetCategory, Expense, Trip } from '../types'

interface Props {
  trip: Trip
  today: string
  onUpdate: (trip: Trip) => void
}

/** 금액 입력칸: 포커스를 잃을 때 저장, 숫자가 아니면 오류 */
function WonInput({ value, label, onSave }: { value: number; label: string; onSave: (value: number) => void }) {
  const [text, setText] = useState(value ? String(value) : '')
  const [invalid, setInvalid] = useState(false)
  return (
    <span className="won-field">
      <input
        inputMode="numeric"
        aria-label={label}
        aria-invalid={invalid}
        className={invalid ? 'won-input invalid' : 'won-input'}
        placeholder="0"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const parsed = parseWon(text)
          setInvalid(parsed === null)
          if (parsed !== null && parsed !== value) onSave(parsed)
        }}
      />
      {invalid && <span className="field-error">숫자만 입력해요 (예: 500000)</span>}
    </span>
  )
}

function ExpenseForm({ trip, today, editing, onSave, onCancel }: {
  trip: Trip
  today: string
  editing?: Expense
  onSave: (e: Expense) => void
  onCancel?: () => void
}) {
  const defaultDate = today < trip.departDate ? today : today > trip.returnDate ? trip.returnDate : today
  const [date, setDate] = useState(editing?.date ?? defaultDate)
  const [category, setCategory] = useState<BudgetCategory>(editing?.category ?? 'food')
  const [amountText, setAmountText] = useState(editing ? String(editing.amount) : '')
  const [memo, setMemo] = useState(editing?.memo ?? '')
  const [errors, setErrors] = useState<string[]>([])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = parseWon(amountText) ?? NaN
    const expense: Expense = { id: editing?.id ?? crypto.randomUUID(), date, category, amount, memo }
    const found = validateExpense(expense)
    setErrors(found)
    if (found.length > 0) return
    onSave(expense)
    if (!editing) {
      setAmountText('')
      setMemo('')
    }
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="expense-grid">
        <input type="date" aria-label="지출 날짜" value={date} onChange={(e) => setDate(e.target.value)} />
        <select aria-label="지출 항목" value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory)}>
          {BUDGET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_NAMES[c]}
            </option>
          ))}
        </select>
        <input inputMode="numeric" aria-label="지출 금액" placeholder="금액(원)" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
        <input aria-label="지출 메모" placeholder="메모" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      {errors.length > 0 && (
        <ul className="errors" role="alert">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
      <div className="actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="secondary">
          {editing ? '수정 저장' : '지출 추가'}
        </button>
      </div>
    </form>
  )
}

/** 여행 "예산" 탭 (TODO 4-1~4-3) */
export function BudgetTab({ trip, today, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const budget = budgetOf(trip)
  const s = summarize(trip)
  const expenses = [...expensesOf(trip)].reverse()

  return (
    <>
      <section className="card budget-summary">
        <div className="card-head">
          <h3>예산 요약</h3>
          {s.usedPercent !== null && <span className={s.overTotal ? 'badge danger' : 'badge'}>{s.usedPercent}% 사용</span>}
        </div>
        <label className="total-row">
          총예산
          <WonInput key={`total-${budget.total}`} value={budget.total} label="총예산" onSave={(v) => onUpdate(setTotal(trip, v))} />
        </label>
        {s.total > 0 && (
          <div className="progress" role="progressbar" aria-valuenow={s.usedPercent ?? 0} aria-valuemin={0} aria-valuemax={100}>
            <div className={s.overTotal ? 'progress-fill over' : 'progress-fill'} style={{ width: `${Math.min(100, s.usedPercent ?? 0)}%` }} />
          </div>
        )}
        <dl className="stat-grid">
          <div>
            <dt>쓴 돈</dt>
            <dd>{formatWon(s.spent)}</dd>
          </div>
          <div>
            <dt>남은 돈</dt>
            <dd className={s.remaining < 0 ? 'danger-text' : ''}>{s.total > 0 ? formatWon(s.remaining) : '총예산 미정'}</dd>
          </div>
          <div>
            <dt>1인당 ({trip.travelers}명)</dt>
            <dd>{formatWon(s.perPerson)}</dd>
          </div>
          <div>
            <dt>하루 평균 ({s.days}일)</dt>
            <dd>{formatWon(s.dailyAverage)}</dd>
          </div>
        </dl>
        {s.warnings.length > 0 && (
          <ul className="warnings" role="alert">
            {s.warnings.map((w) => (
              <li key={w}>⚠️ {w}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>항목별 예산</h3>
        <p className="muted">비워 두면 그 항목은 예산 없이 쓴 돈만 기록해요.</p>
        <ul className="category-list">
          {s.categories.map((c) => (
            <li key={c.category} className={c.over ? 'over' : ''}>
              <span className="category-name">{CATEGORY_NAMES[c.category]}</span>
              <WonInput
                key={`${c.category}-${c.budget}`}
                value={c.budget}
                label={`${CATEGORY_NAMES[c.category]} 예산`}
                onSave={(v) => onUpdate(setCategoryBudget(trip, c.category, v))}
              />
              <span className="category-spent">{formatWon(c.spent)} 씀</span>
              {c.budget > 0 && (
                <span className="mini-bar" aria-hidden>
                  <span style={{ width: `${Math.min(100, Math.round((c.spent / c.budget) * 100))}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>지출 기록</h3>
        <ExpenseForm trip={trip} today={today} onSave={(e) => onUpdate(upsertExpense(trip, e))} />
        {expenses.length === 0 ? (
          <p className="muted">아직 기록한 지출이 없어요.</p>
        ) : (
          <ul className="expense-list">
            {expenses.map((e) =>
              editingId === e.id ? (
                <li key={e.id} className="editing">
                  <ExpenseForm
                    trip={trip}
                    today={today}
                    editing={e}
                    onSave={(next) => {
                      onUpdate(upsertExpense(trip, next))
                      setEditingId(null)
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li key={e.id}>
                  <span className="memo-date">{e.date}</span>
                  <span className="expense-main">
                    <span className="tag">{CATEGORY_NAMES[e.category]}</span> {e.memo}
                  </span>
                  <strong>{formatWon(e.amount)}</strong>
                  <button type="button" className="text-button" onClick={() => setEditingId(e.id)}>
                    수정
                  </button>
                  <button type="button" className="text-button" onClick={() => onUpdate(removeExpense(trip, e.id))}>
                    삭제
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </>
  )
}
