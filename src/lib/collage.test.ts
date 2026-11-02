import { describe, expect, it } from 'vitest'
import { collageLayout, coverCrop } from './collage'

describe('콜라주 배치 (8-3)', () => {
  it('사진 수에 따라 1·2·3열로 나누고 9장까지만', () => {
    expect(collageLayout(0)).toEqual([])
    expect(collageLayout(1)).toHaveLength(1)
    expect(collageLayout(4)).toHaveLength(4)
    expect(collageLayout(12)).toHaveLength(9)
    expect(new Set(collageLayout(4).map((c) => c.x)).size).toBe(2)
    expect(new Set(collageLayout(9).map((c) => c.x)).size).toBe(3)
  })

  it('모든 칸이 캔버스 안에 있고 제목 자리(위 140px)를 침범하지 않는다', () => {
    for (let n = 1; n <= 9; n++) {
      for (const c of collageLayout(n)) {
        expect(c.y).toBeGreaterThanOrEqual(140)
        expect(c.x + c.width).toBeLessThanOrEqual(1080)
        expect(c.y + c.height).toBeLessThanOrEqual(1080)
      }
    }
  })

  it('마지막 줄이 덜 차면 그 줄 칸을 넓혀 빈칸이 없다 (5장 = 3장 + 2장)', () => {
    const cells = collageLayout(5)
    const last = cells.slice(3)
    expect(last).toHaveLength(2)
    expect(last[0].width).toBeGreaterThan(cells[0].width)
    expect(last[1].x + last[1].width).toBe(cells[2].x + cells[2].width)
  })

  it('세로 사진을 가로 칸에 넣으면 위아래를 잘라 꽉 채운다', () => {
    const crop = coverCrop(1000, 2000, { width: 500, height: 250 })
    expect(crop.sw).toBe(1000)
    expect(crop.sh).toBe(500)
    expect(crop.sy).toBe(750)
  })
})
