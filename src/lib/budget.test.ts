import { describe, expect, it } from 'vitest'
import { sampleTrip } from '../test/fixtures'
import type { Expense, Trip } from '../types'
import { formatWon, parseWon, removeExpense, setCategoryBudget, setTotal, summarize, upsertExpense, validateExpense } from './budget'

// sampleTrip: 2026-12-01 ~ 2026-12-05 (5일), 2명
function expense(id: string, amount: number, category: Expense['category'] = 'food', date = '2026-12-02'): Expense {
  return { id, date, category, amount, memo: '' }
}

function withExpenses(trip: Trip, list: Expense[]): Trip {
  return list.reduce(upsertExpense, trip)
}

describe('예산 설정 (4-1)', () => {
  it('총예산과 항목별 예산을 정하고, 0원으로 바꾸면 항목 예산을 지운다', () => {
    let t = setTotal(sampleTrip(), 1_000_000)
    t = setCategoryBudget(t, 'food', 300_000)
    expect(t.budget).toEqual({ total: 1_000_000, byCategory: { food: 300_000 } })
    expect(setCategoryBudget(t, 'food', 0).budget?.byCategory).toEqual({})
  })

  it('금액 입력: 쉼표 허용, 빈 칸은 0, 숫자가 아니면 거부', () => {
    expect(parseWon('1,200,000')).toBe(1_200_000)
    expect(parseWon(' ')).toBe(0)
    expect(parseWon('12.5')).toBeNull()
    expect(parseWon('-3')).toBeNull()
    expect(parseWon('만원')).toBeNull()
    expect(formatWon(1234567)).toBe('1,234,567원')
  })
})

describe('지출 기록 (4-2)', () => {
  it('날짜·항목·금액을 검사한다', () => {
    expect(validateExpense(expense('a', 5000))).toEqual([])
    expect(validateExpense({ ...expense('a', 0) })).toEqual(['금액은 1원 이상 숫자로 입력하세요.'])
    expect(validateExpense({ date: '2026-13-01', amount: 1 })).toHaveLength(2)
  })

  it('추가·수정·삭제하고 날짜순으로 정렬한다', () => {
    let t = withExpenses(sampleTrip(), [expense('b', 10_000, 'food', '2026-12-03'), expense('a', 5_000, 'food', '2026-12-01')])
    expect(t.expenses?.map((e) => e.id)).toEqual(['a', 'b'])
    t = upsertExpense(t, { ...expense('a', 7_000, 'transport', '2026-12-04'), memo: ' 택시 ' })
    expect(t.expenses?.map((e) => [e.id, e.amount, e.category, e.memo])).toEqual([
      ['b', 10_000, 'food', ''],
      ['a', 7_000, 'transport', '택시'],
    ])
    expect(removeExpense(t, 'b').expenses?.map((e) => e.id)).toEqual(['a'])
  })
})

describe('예산 요약 (4-3, 4-4)', () => {
  it('지출이 없고 예산도 0원이면 모두 0, 경고 없음', () => {
    const s = summarize(sampleTrip())
    expect(s).toMatchObject({ total: 0, spent: 0, remaining: 0, usedPercent: null, perPerson: 0, dailyAverage: 0, days: 5, warnings: [] })
  })

  it('남은 금액·사용률·1인당·하루 평균 (2명, 5일)', () => {
    const t = withExpenses(setTotal(sampleTrip(), 1_000_000), [expense('a', 300_000, 'flight'), expense('b', 101_000)])
    expect(summarize(t)).toMatchObject({ spent: 401_000, remaining: 599_000, usedPercent: 40, perPerson: 200_500, dailyAverage: 80_200 })
  })

  it('1명이면 1인당 = 전체 지출', () => {
    const t = withExpenses(sampleTrip({ travelers: 1 }), [expense('a', 33_333)])
    expect(summarize(t).perPerson).toBe(33_333)
  })

  it('당일치기는 1일로 나눈다', () => {
    const day = sampleTrip({ departDate: '2026-12-01', returnDate: '2026-12-01' })
    const s = summarize(withExpenses(day, [expense('a', 50_000, 'food', '2026-12-01')]))
    expect(s.days).toBe(1)
    expect(s.dailyAverage).toBe(50_000)
  })

  it('총예산 초과, 항목 예산 초과를 경고한다 (딱 맞으면 초과 아님)', () => {
    let t = setCategoryBudget(setTotal(sampleTrip(), 100_000), 'food', 30_000)
    t = withExpenses(t, [expense('a', 30_000)])
    expect(summarize(t).warnings).toEqual([])
    t = withExpenses(t, [expense('b', 80_000, 'food')])
    const s = summarize(t)
    expect(s.overTotal).toBe(true)
    expect(s.remaining).toBe(-10_000)
    expect(s.categories.find((c) => c.category === 'food')).toMatchObject({ budget: 30_000, spent: 110_000, over: true })
    expect(s.warnings).toEqual(['총예산을 10,000원 넘었어요.', '식비 예산을 80,000원 넘었어요.'])
  })

  it('항목별 예산 합이 총예산보다 많으면 알려준다', () => {
    let t = setTotal(sampleTrip(), 100_000)
    t = setCategoryBudget(setCategoryBudget(t, 'flight', 80_000), 'lodging', 50_000)
    expect(summarize(t).warnings).toEqual(['항목별 예산 합(130,000원)이 총예산보다 많아요.'])
  })

  it('항목 예산이 없는 항목은 지출이 있어도 초과로 보지 않는다', () => {
    const t = withExpenses(setTotal(sampleTrip(), 500_000), [expense('a', 40_000, 'shopping')])
    expect(summarize(t).categories.find((c) => c.category === 'shopping')).toMatchObject({ budget: 0, spent: 40_000, over: false })
  })
})
