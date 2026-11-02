import type { Budget, BudgetCategory, Expense, Trip } from '../types'
import { daysBetween, isISODate } from './date'

export const BUDGET_CATEGORIES: BudgetCategory[] = ['flight', 'lodging', 'food', 'transport', 'sights', 'shopping', 'other']

export const CATEGORY_NAMES: Record<BudgetCategory, string> = {
  flight: '항공',
  lodging: '숙소',
  food: '식비',
  transport: '교통',
  sights: '관광',
  shopping: '쇼핑',
  other: '기타',
}

export const EMPTY_BUDGET: Budget = { total: 0, byCategory: {} }

export function budgetOf(trip: Trip): Budget {
  return trip.budget ?? EMPTY_BUDGET
}

export function expensesOf(trip: Trip): Expense[] {
  return trip.expenses ?? []
}

/** 금액 입력 검사: 0 이상 정수(원). 쉼표는 허용한다. */
export function parseWon(input: string): number | null {
  const cleaned = input.replaceAll(',', '').trim()
  if (cleaned === '') return 0
  if (!/^\d+$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isSafeInteger(value) ? value : null
}

// 한국어 숫자 형식 데이터를 처음 불러올 때 느린 환경(GitHub Actions에서 5초 넘게 걸림)이 있어 한 번만 만든다
const wonFormat = new Intl.NumberFormat('ko-KR')

export function formatWon(value: number): string {
  return `${wonFormat.format(value)}원`
}

export function setTotal(trip: Trip, total: number): Trip {
  return { ...trip, budget: { ...budgetOf(trip), total } }
}

export function setCategoryBudget(trip: Trip, category: BudgetCategory, amount: number): Trip {
  const byCategory = { ...budgetOf(trip).byCategory }
  if (amount > 0) byCategory[category] = amount
  else delete byCategory[category]
  return { ...trip, budget: { ...budgetOf(trip), byCategory } }
}

/** 지출 입력 검사. 문제가 없으면 빈 배열. */
export function validateExpense(input: Partial<Expense>): string[] {
  const errors: string[] = []
  if (!isISODate(input.date)) errors.push('날짜를 입력하세요.')
  if (!input.category || !BUDGET_CATEGORIES.includes(input.category)) errors.push('항목을 고르세요.')
  if (!input.amount || !Number.isSafeInteger(input.amount) || input.amount <= 0) errors.push('금액은 1원 이상 숫자로 입력하세요.')
  return errors
}

/** 지출 추가 또는 수정 (같은 id가 있으면 바꾼다), 날짜순 정렬 */
export function upsertExpense(trip: Trip, expense: Expense): Trip {
  const others = expensesOf(trip).filter((e) => e.id !== expense.id)
  const expenses = [...others, { ...expense, memo: expense.memo.trim() }].sort((a, b) => a.date.localeCompare(b.date))
  return { ...trip, expenses }
}

export function removeExpense(trip: Trip, id: string): Trip {
  return { ...trip, expenses: expensesOf(trip).filter((e) => e.id !== id) }
}

export interface CategorySummary {
  category: BudgetCategory
  budget: number
  spent: number
  over: boolean
}

export interface BudgetSummary {
  total: number
  spent: number
  /** 총예산 - 지출 (음수면 초과) */
  remaining: number
  /** 지출 비율 (%), 총예산이 0이면 null */
  usedPercent: number | null
  overTotal: boolean
  /** 쓴 돈 ÷ 인원 */
  perPerson: number
  /** 쓴 돈 ÷ 여행 일수 (당일치기는 1일) */
  dailyAverage: number
  days: number
  categories: CategorySummary[]
  /** 항목별 예산 합이 총예산보다 많음 */
  categoriesExceedTotal: boolean
  warnings: string[]
}

/** 예산 요약 (TODO 4-3). 금액은 원 단위로 반올림한다. */
export function summarize(trip: Trip): BudgetSummary {
  const { total, byCategory } = budgetOf(trip)
  const expenses = expensesOf(trip)
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const days = Math.max(1, daysBetween(trip.departDate, trip.returnDate) + 1)
  const categories = BUDGET_CATEGORIES.map((category) => {
    const budget = byCategory[category] ?? 0
    const used = expenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0)
    return { category, budget, spent: used, over: budget > 0 && used > budget }
  })
  const categoryBudgetSum = categories.reduce((sum, c) => sum + c.budget, 0)
  const overTotal = total > 0 && spent > total
  const categoriesExceedTotal = total > 0 && categoryBudgetSum > total

  const warnings: string[] = []
  if (overTotal) warnings.push(`총예산을 ${formatWon(spent - total)} 넘었어요.`)
  for (const c of categories) {
    if (c.over) warnings.push(`${CATEGORY_NAMES[c.category]} 예산을 ${formatWon(c.spent - c.budget)} 넘었어요.`)
  }
  if (categoriesExceedTotal) warnings.push(`항목별 예산 합(${formatWon(categoryBudgetSum)})이 총예산보다 많아요.`)

  return {
    total,
    spent,
    remaining: total - spent,
    usedPercent: total > 0 ? Math.round((spent / total) * 100) : null,
    overTotal,
    perPerson: Math.round(spent / Math.max(1, trip.travelers)),
    dailyAverage: Math.round(spent / days),
    days,
    categories,
    categoriesExceedTotal,
    warnings,
  }
}
