import type { ISODate, JournalEntry, JournalSlot, Trip } from '../types'
import { daysBetween, isISODate } from './date'

export const SLOTS: JournalSlot[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other']

export const SLOT_NAMES: Record<JournalSlot, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식·카페',
  other: '기타',
}

export function journalOf(trip: Trip): JournalEntry[] {
  return trip.journal ?? []
}

/** 출국일을 1일차로 센 일차. 여행 전이면 0 이하, 귀국 뒤면 마지막 일차보다 크다. */
export function dayNumber(trip: Trip, date: ISODate): number {
  return daysBetween(trip.departDate, date) + 1
}

export function dayLabel(trip: Trip, date: ISODate): string {
  const n = dayNumber(trip, date)
  const last = dayNumber(trip, trip.returnDate)
  if (n < 1) return '여행 전'
  if (n > last) return '여행 후'
  return `${n}일차`
}

/** 기록 입력 검사: 날짜는 필수, 사진이나 멘트 중 하나는 있어야 한다 */
export function validateEntry(input: Partial<JournalEntry>): string[] {
  const errors: string[] = []
  if (!isISODate(input.date)) errors.push('날짜를 고르세요.')
  if (!input.photoId && !input.caption?.trim()) errors.push('사진이나 한 줄 멘트 중 하나는 남겨 주세요.')
  if ((input.caption?.length ?? 0) > 200) errors.push('멘트는 200자까지 쓸 수 있어요.')
  return errors
}

export function addEntry(trip: Trip, entry: JournalEntry): Trip {
  return { ...trip, journal: [...journalOf(trip), { ...entry, caption: entry.caption.trim() }] }
}

export function removeEntry(trip: Trip, id: string): Trip {
  return { ...trip, journal: journalOf(trip).filter((e) => e.id !== id) }
}

export interface JournalDay {
  date: ISODate
  label: string
  entries: JournalEntry[]
}

/** 날짜별로 묶고, 하루 안에서는 아침→점심→저녁→간식→기타, 같으면 올린 순서 */
export function groupByDay(trip: Trip): JournalDay[] {
  const byDate = new Map<ISODate, JournalEntry[]>()
  for (const e of journalOf(trip)) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e])
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => ({
      date,
      label: dayLabel(trip, date),
      entries: [...entries].sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) || a.createdAt.localeCompare(b.createdAt)),
    }))
}

/** 기록 날짜 기본값: 여행 중이면 오늘, 아니면 가까운 여행 날짜 */
export function defaultEntryDate(trip: Trip, today: ISODate): ISODate {
  if (today < trip.departDate) return trip.departDate
  if (today > trip.returnDate) return trip.returnDate
  return today
}

/** 사진이 있는 기록 (콜라주용), 하루만 고르면 그날만 */
export function photoEntries(trip: Trip, date?: ISODate): JournalEntry[] {
  return groupByDay(trip)
    .filter((d) => !date || d.date === date)
    .flatMap((d) => d.entries)
    .filter((e) => e.photoId)
}

/**
 * 예전 "메모"(날짜·한 줄)를 여행 기록(기타)으로 옮긴다. 메모 탭을 여행 기록 탭으로 합치면서 데이터를 잃지 않게 한다.
 * 이미 옮긴 메모(같은 id)는 다시 옮기지 않는다.
 */
export function migrateMemos(trip: Trip): Trip {
  if (trip.memos.length === 0) return trip
  const existing = new Set(journalOf(trip).map((e) => e.id))
  const moved: JournalEntry[] = trip.memos
    .filter((m) => !existing.has(`memo-${m.id}`))
    .map((m) => ({ id: `memo-${m.id}`, date: m.date, slot: 'other', caption: m.text, createdAt: `${m.date}T00:00:00.000Z` }))
  return { ...trip, memos: [], journal: [...journalOf(trip), ...moved] }
}

export interface JournalPhoto {
  trip: Trip
  entry: JournalEntry
  dayLabel: string
}

/** 여러 여행의 기록을 한 번에 (여행 기록 페이지, TODO 10-1): 최근 여행 먼저, 여행 안에서는 일차·때 순서 */
export function tripsWithJournal(trips: Trip[]): Trip[] {
  return trips.filter((t) => journalOf(t).length > 0).sort((a, b) => b.departDate.localeCompare(a.departDate))
}

export function allPhotos(trips: Trip[]): JournalPhoto[] {
  return tripsWithJournal(trips).flatMap((trip) =>
    groupByDay(trip).flatMap((d) => d.entries.filter((e) => e.photoId).map((entry) => ({ trip, entry, dayLabel: d.label }))),
  )
}
