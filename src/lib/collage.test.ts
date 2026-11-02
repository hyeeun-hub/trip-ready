import { describe, expect, it } from 'vitest'
import { collageLayout, COLLAGE_HEIGHT, COLLAGE_WIDTH, coverCrop, maxPhotos, templateCells, TEMPLATES, toggleSelection } from './collage'

describe('콜라주 배치 (8-3)', () => {
  it('사진 수에 따라 1·2·3열로 나누고 9장까지만', () => {
    expect(collageLayout(0)).toEqual([])
    expect(collageLayout(1)).toHaveLength(1)
    expect(collageLayout(4)).toHaveLength(4)
    expect(collageLayout(12)).toHaveLength(9)
    expect(new Set(collageLayout(4).map((c) => c.x)).size).toBe(2)
    expect(new Set(collageLayout(9).map((c) => c.x)).size).toBe(3)
  })

  it('마지막 줄이 덜 차면 그 줄 칸을 넓혀 빈칸이 없다 (5장 = 3장 + 2장)', () => {
    const cells = collageLayout(5)
    const last = cells.slice(3)
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

describe('콜라주 템플릿 (10-2)', () => {
  it('템플릿마다 최대 장수까지만 배치한다', () => {
    for (const t of TEMPLATES) {
      expect(templateCells(t.id, 20)).toHaveLength(t.max)
      expect(templateCells(t.id, 1)).toHaveLength(1)
      expect(templateCells(t.id, 0)).toEqual([])
    }
    expect(maxPhotos('film')).toBe(4)
  })

  it('모든 칸이 캔버스(1080×1350) 안에 있다', () => {
    for (const t of TEMPLATES) {
      for (let n = 1; n <= t.max; n++) {
        for (const c of templateCells(t.id, n)) {
          expect(c.x, `${t.id} ${n}`).toBeGreaterThanOrEqual(0)
          expect(c.y, `${t.id} ${n}`).toBeGreaterThanOrEqual(0)
          expect(c.x + c.width, `${t.id} ${n}`).toBeLessThanOrEqual(COLLAGE_WIDTH)
          expect(c.y + c.height, `${t.id} ${n}`).toBeLessThanOrEqual(COLLAGE_HEIGHT)
        }
      }
    }
  })

  it('폴라로이드는 기울기와 글씨 자리가 있고, 매거진은 첫 장이 큰 사진', () => {
    const polaroid = templateCells('polaroid', 4)
    expect(polaroid.every((c) => c.rotate !== undefined && c.captionHeight)).toBe(true)
    const magazine = templateCells('magazine', 3)
    expect(magazine[0].width).toBe(COLLAGE_WIDTH)
    expect(magazine[0].height).toBeGreaterThan(magazine[1].height * 2)
  })
})

describe('콜라주 사진 고르기 (10-2)', () => {
  it('누른 순서대로 고르고, 다시 누르면 빠지고, 최대 장수를 넘지 않는다', () => {
    let order: string[] = []
    order = toggleSelection(order, 'b', 3)
    order = toggleSelection(order, 'a', 3)
    order = toggleSelection(order, 'c', 3)
    expect(order).toEqual(['b', 'a', 'c'])
    expect(toggleSelection(order, 'd', 3)).toEqual(['b', 'a', 'c'])
    expect(toggleSelection(order, 'a', 3)).toEqual(['b', 'c'])
  })
})
