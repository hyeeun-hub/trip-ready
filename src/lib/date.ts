const DAY_MS = 24 * 60 * 60 * 1000

/** 'YYYY-MM-DD' 두 날짜 사이의 일수 (to - from). 시간대 영향을 받지 않도록 UTC로 계산한다. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}
