import type { ChecklistItem } from '../types'

/** 준비 체크리스트 기본 항목 (PRD F5) */
export const DEFAULT_CHECKLIST = ['여권 유효기간 확인', '항공권 예약', '숙소 예약', '여행자 보험', '환전·해외 결제 카드', '유심·eSIM', '짐 싸기']

export function defaultChecklist(): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map((title, i) => ({ id: `default-${i}`, title, done: false, custom: false }))
}

export function toggleItem(list: ChecklistItem[], id: string): ChecklistItem[] {
  return list.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
}

/** 직접 추가. 빈 이름이나 이미 있는 이름이면 그대로 돌려준다. */
export function addItem(list: ChecklistItem[], title: string, id: string = crypto.randomUUID()): ChecklistItem[] {
  const name = title.trim()
  if (!name || list.some((item) => item.title === name)) return list
  return [...list, { id, title: name, done: false, custom: true }]
}

/** 직접 추가한 항목만 지울 수 있다. */
export function removeItem(list: ChecklistItem[], id: string): ChecklistItem[] {
  return list.filter((item) => item.id !== id || !item.custom)
}

/** 진행률 (%) */
export function progress(list: ChecklistItem[]): number {
  if (list.length === 0) return 0
  return Math.round((list.filter((item) => item.done).length / list.length) * 100)
}
