import { describe, expect, it } from 'vitest'
import { POPULAR_CITIES } from '../data/cities'
import { sampleTrip } from '../test/fixtures'
import { addMemo, createTrip, dDayLabel, removeMemo, splitTrips, validateNewTrip } from './trips'

const input = {
  city: POPULAR_CITIES[1],
  originName: '서울',
  originIata: 'ICN',
  departDate: '2026-12-01',
  returnDate: '2026-12-05',
  travelers: 2,
}

describe('여행 만들기 (1-3)', () => {
  it('올바른 입력은 오류가 없다 (당일치기 포함)', () => {
    expect(validateNewTrip(input)).toEqual([])
    expect(validateNewTrip({ ...input, returnDate: input.departDate })).toEqual([])
  })

  it('빠진 값, 날짜 순서, 인원을 검사한다', () => {
    expect(validateNewTrip({})).toHaveLength(3)
    expect(validateNewTrip({ ...input, returnDate: '2026-11-30' })).toEqual(['귀국일은 출국일과 같거나 뒤여야 합니다.'])
    expect(validateNewTrip({ ...input, travelers: 0 })).toEqual(['인원은 1명 이상이어야 합니다.'])
  })

  it('새 여행은 기본 체크리스트와 빈 메모로 시작한다', () => {
    const trip = createTrip(input)
    expect(trip.checklist).toHaveLength(7)
    expect(trip.memos).toEqual([])
    expect(createTrip(input).id).not.toBe(trip.id)
  })
})

describe('여행 목록 나누기 (1-3)', () => {
  it('귀국일 기준으로 다가오는 여행과 다녀온 여행을 나눈다', () => {
    const past = sampleTrip({ id: 'past', departDate: '2026-09-01', returnDate: '2026-09-03' })
    const ongoing = sampleTrip({ id: 'now', departDate: '2026-10-30', returnDate: '2026-11-02' })
    const later = sampleTrip({ id: 'later', departDate: '2027-01-10', returnDate: '2027-01-12' })
    const soon = sampleTrip({ id: 'soon' })
    const { upcoming, past: done } = splitTrips([later, past, soon, ongoing], '2026-11-02')
    expect(upcoming.map((t) => t.id)).toEqual(['now', 'soon', 'later'])
    expect(done.map((t) => t.id)).toEqual(['past'])
  })

  it('D-day 표시', () => {
    expect(dDayLabel('2026-11-02', sampleTrip())).toBe('D-29')
    expect(dDayLabel('2026-12-01', sampleTrip())).toBe('D-DAY')
    expect(dDayLabel('2026-12-03', sampleTrip())).toBe('여행 중')
    expect(dDayLabel('2026-12-06', sampleTrip())).toBe('다녀옴')
  })
})

describe('여행 메모 (1-6)', () => {
  it('날짜순으로 쌓이고 빈 메모는 무시한다', () => {
    let trip = addMemo(sampleTrip(), '2026-12-03', '야시장', 'b')
    trip = addMemo(trip, '2026-12-01', ' 도착 ', 'a')
    expect(trip.memos.map((m) => [m.id, m.text])).toEqual([
      ['a', '도착'],
      ['b', '야시장'],
    ])
    expect(addMemo(trip, '2026-12-04', '  ')).toBe(trip)
    expect(removeMemo(trip, 'a').memos.map((m) => m.id)).toEqual(['b'])
  })
})
