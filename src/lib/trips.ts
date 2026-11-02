import type { NewTrip, Trip, TripMemo } from '../types'
import { defaultChecklist } from './checklist'
import { daysBetween } from './date'

/** 여행 만들기 입력 검사. 문제가 없으면 빈 배열. */
export function validateNewTrip(input: Partial<NewTrip>): string[] {
  const errors: string[] = []
  if (!input.city) errors.push('여행 도시를 고르세요.')
  if (!input.departDate) errors.push('출국일을 입력하세요.')
  if (!input.returnDate) errors.push('귀국일을 입력하세요.')
  if (input.departDate && input.returnDate && daysBetween(input.departDate, input.returnDate) < 0) {
    errors.push('귀국일은 출국일과 같거나 뒤여야 합니다.')
  }
  if (input.travelers !== undefined && (!Number.isInteger(input.travelers) || input.travelers < 1)) {
    errors.push('인원은 1명 이상이어야 합니다.')
  }
  return errors
}

export function createTrip(input: NewTrip, now: Date = new Date()): Trip {
  return { ...input, id: crypto.randomUUID(), checklist: defaultChecklist(), memos: [], createdAt: now.toISOString() }
}

/** 다가오는 여행(귀국일이 오늘 이후, 출국일 가까운 순)과 다녀온 여행(귀국일이 지남, 최근 순) */
export function splitTrips(trips: Trip[], today: string): { upcoming: Trip[]; past: Trip[] } {
  const upcoming = trips.filter((t) => t.returnDate >= today).sort((a, b) => a.departDate.localeCompare(b.departDate))
  const past = trips.filter((t) => t.returnDate < today).sort((a, b) => b.departDate.localeCompare(a.departDate))
  return { upcoming, past }
}

/** 메모 추가 (빈 메모는 무시), 날짜순 정렬 */
export function addMemo(trip: Trip, date: string, text: string, id: string = crypto.randomUUID()): Trip {
  const body = text.trim()
  if (!body) return trip
  const memos: TripMemo[] = [...trip.memos, { id, date, text: body }].sort((a, b) => a.date.localeCompare(b.date))
  return { ...trip, memos }
}

export function removeMemo(trip: Trip, id: string): Trip {
  return { ...trip, memos: trip.memos.filter((m) => m.id !== id) }
}

/** D-day 표시 */
export function dDayLabel(today: string, trip: Trip): string {
  const d = daysBetween(today, trip.departDate)
  if (d > 0) return `D-${d}`
  if (d === 0) return 'D-DAY'
  return trip.returnDate >= today ? '여행 중' : '다녀옴'
}
