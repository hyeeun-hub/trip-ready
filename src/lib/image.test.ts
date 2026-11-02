import { describe, expect, it } from 'vitest'
import { fitSize } from './image'

describe('사진 크기 줄이기 (8-2)', () => {
  it('가로·세로 사진 모두 긴 변을 1280px에 맞추고 비율을 유지한다', () => {
    expect(fitSize(4032, 3024)).toEqual({ width: 1280, height: 960 })
    expect(fitSize(3024, 4032)).toEqual({ width: 960, height: 1280 })
  })

  it('이미 작은 사진은 키우지 않는다', () => {
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 })
  })
})
