import { describe, expect, it } from 'vitest'
import { sampleTrip } from '../test/fixtures'
import type { JournalEntry, Trip } from '../types'
import { addEntry, dayLabel, dayNumber, defaultEntryDate, groupByDay, photoEntries, removeEntry, validateEntry } from './journal'

// sampleTrip: 2026-12-01 ~ 2026-12-05 (5일)
function entry(id: string, date: string, slot: JournalEntry['slot'], extra: Partial<JournalEntry> = {}): JournalEntry {
  return { id, date, slot, caption: id, createdAt: `2026-12-01T0${id.length}:00:00.000Z`, ...extra }
}

describe('일차 계산 (8-1)', () => {
  const trip = sampleTrip()
  it('출국일이 1일차, 귀국일이 마지막 일차', () => {
    expect(dayNumber(trip, '2026-12-01')).toBe(1)
    expect(dayNumber(trip, '2026-12-05')).toBe(5)
    expect(dayLabel(trip, '2026-12-03')).toBe('3일차')
  })

  it('여행 기간 밖은 여행 전·후', () => {
    expect(dayLabel(trip, '2026-11-30')).toBe('여행 전')
    expect(dayLabel(trip, '2026-12-06')).toBe('여행 후')
  })

  it('기록 날짜 기본값은 여행 기간 안으로 맞춘다', () => {
    expect(defaultEntryDate(trip, '2026-11-02')).toBe('2026-12-01')
    expect(defaultEntryDate(trip, '2026-12-03')).toBe('2026-12-03')
    expect(defaultEntryDate(trip, '2027-01-01')).toBe('2026-12-05')
  })
})

describe('기록 남기기 (8-1)', () => {
  it('사진이나 멘트 중 하나는 있어야 하고, 멘트는 200자까지', () => {
    expect(validateEntry({ date: '2026-12-01', caption: '라멘' })).toEqual([])
    expect(validateEntry({ date: '2026-12-01', caption: '', photoId: 'p1' })).toEqual([])
    expect(validateEntry({ date: '2026-12-01', caption: '  ' })).toEqual(['사진이나 한 줄 멘트 중 하나는 남겨 주세요.'])
    expect(validateEntry({ caption: 'x' })).toEqual(['날짜를 고르세요.'])
    expect(validateEntry({ date: '2026-12-01', caption: 'x'.repeat(201) })).toEqual(['멘트는 200자까지 쓸 수 있어요.'])
  })

  it('일차별로 묶고 하루 안에서는 아침→점심→저녁 순서', () => {
    let t: Trip = sampleTrip()
    t = addEntry(t, entry('dinner1', '2026-12-01', 'dinner'))
    t = addEntry(t, entry('lunch2', '2026-12-02', 'lunch'))
    t = addEntry(t, entry('b1', '2026-12-01', 'breakfast'))
    t = addEntry(t, entry('lunch1', '2026-12-01', 'lunch'))
    expect(groupByDay(t).map((d) => [d.label, d.entries.map((e) => e.id)])).toEqual([
      ['1일차', ['b1', 'lunch1', 'dinner1']],
      ['2일차', ['lunch2']],
    ])
    expect(groupByDay(removeEntry(t, 'lunch2')).map((d) => d.label)).toEqual(['1일차'])
  })

  it('멘트 앞뒤 공백은 지운다', () => {
    expect(addEntry(sampleTrip(), entry('a', '2026-12-01', 'lunch', { caption: '  오코노미야키 ' })).journal?.[0].caption).toBe('오코노미야키')
  })

  it('콜라주용: 사진 있는 기록만, 하루를 고르면 그날만', () => {
    let t: Trip = sampleTrip()
    t = addEntry(t, entry('a', '2026-12-01', 'lunch', { photoId: 'p1' }))
    t = addEntry(t, entry('b', '2026-12-01', 'dinner'))
    t = addEntry(t, entry('c', '2026-12-02', 'lunch', { photoId: 'p2' }))
    expect(photoEntries(t).map((e) => e.id)).toEqual(['a', 'c'])
    expect(photoEntries(t, '2026-12-02').map((e) => e.id)).toEqual(['c'])
  })
})

describe('메모를 여행 기록으로 옮기기 (8-1)', () => {
  it('예전 메모는 기타 기록이 되고 메모는 비운다', async () => {
    const { migrateMemos } = await import('./journal')
    const t = migrateMemos(sampleTrip({ memos: [{ id: 'm1', date: '2026-12-02', text: '비 옴' }] }))
    expect(t.memos).toEqual([])
    expect(t.journal).toEqual([{ id: 'memo-m1', date: '2026-12-02', slot: 'other', caption: '비 옴', createdAt: '2026-12-02T00:00:00.000Z' }])
    expect(migrateMemos(t)).toBe(t)
  })
})

describe('여러 여행 기록 모아 보기 (10-1)', () => {
  it('기록 있는 여행만, 최근 여행 먼저, 사진은 여행·일차 순서', async () => {
    const { allPhotos, tripsWithJournal } = await import('./journal')
    const older = sampleTrip({ id: 'old', departDate: '2026-03-01', returnDate: '2026-03-03', journal: [entry('o1', '2026-03-01', 'lunch', { photoId: 'p-o1' })] })
    const newer = sampleTrip({
      id: 'new',
      journal: [entry('n2', '2026-12-02', 'lunch', { photoId: 'p-n2' }), entry('n1', '2026-12-01', 'dinner', { photoId: 'p-n1' }), entry('n3', '2026-12-01', 'lunch')],
    })
    const empty = sampleTrip({ id: 'empty' })
    expect(tripsWithJournal([older, empty, newer]).map((t) => t.id)).toEqual(['new', 'old'])
    expect(allPhotos([older, empty, newer]).map((p) => `${p.trip.id}:${p.entry.id}:${p.dayLabel}`)).toEqual(['new:n1:1일차', 'new:n2:2일차', 'old:o1:1일차'])
  })
})
