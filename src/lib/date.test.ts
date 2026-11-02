import { describe, expect, it } from 'vitest'
import { daysBetween, isISODate } from './date'

describe('daysBetween', () => {
  it('같은 날은 0일', () => {
    expect(daysBetween('2026-11-02', '2026-11-02')).toBe(0)
  })

  it('월이 바뀌어도 일수를 정확히 센다', () => {
    expect(daysBetween('2026-11-02', '2026-12-02')).toBe(30)
  })

  it('과거 날짜는 음수', () => {
    expect(daysBetween('2026-11-02', '2026-10-31')).toBe(-2)
  })
})

describe('isISODate', () => {
  it('없는 날짜·없는 달도 오류 없이 false', () => {
    expect(isISODate('2026-12-01')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-13-01')).toBe(false)
    expect(isISODate('2026/12/01')).toBe(false)
    expect(isISODate(undefined)).toBe(false)
  })
})
