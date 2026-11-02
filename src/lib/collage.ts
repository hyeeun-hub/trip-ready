/** 콜라주 칸 하나 (픽셀). rotate는 도(°), captionHeight는 사진 아래 글씨 자리 */
export interface Cell {
  x: number
  y: number
  width: number
  height: number
  rotate?: number
  captionHeight?: number
}

export type CollageTemplate = 'grid' | 'polaroid' | 'film' | 'magazine'

export const TEMPLATES: { id: CollageTemplate; name: string; max: number }[] = [
  { id: 'grid', name: '격자', max: 9 },
  { id: 'polaroid', name: '폴라로이드', max: 6 },
  { id: 'film', name: '필름', max: 4 },
  { id: 'magazine', name: '매거진', max: 5 },
]

/** 인스타그램 세로 비율(4:5) */
export const COLLAGE_WIDTH = 1080
export const COLLAGE_HEIGHT = 1350

export const MAX_COLLAGE_PHOTOS = 9

export function maxPhotos(template: CollageTemplate): number {
  return TEMPLATES.find((t) => t.id === template)?.max ?? MAX_COLLAGE_PHOTOS
}

/**
 * area 안에 사진 n장을 격자로 배치한다 (TODO 8-3, 10-2).
 * 1장은 꽉 차게, 2~4장은 2열, 5~9장은 3열. 마지막 줄이 덜 차면 그 줄 칸을 넓혀 빈칸이 없게 한다.
 */
export function gridCells(n: number, area: { x: number; y: number; width: number; height: number }, gap = 12): Cell[] {
  const count = Math.max(0, Math.min(MAX_COLLAGE_PHOTOS, n))
  if (count === 0) return []
  const cols = count === 1 ? 1 : count <= 4 ? 2 : 3
  const rows = Math.ceil(count / cols)
  const rowH = (area.height - gap * (rows - 1)) / rows
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, count - r * cols)
    const cellW = (area.width - gap * (inRow - 1)) / inRow
    for (let c = 0; c < inRow; c++) {
      cells.push({
        x: Math.round(area.x + c * (cellW + gap)),
        y: Math.round(area.y + r * (rowH + gap)),
        width: Math.round(cellW),
        height: Math.round(rowH),
      })
    }
  }
  return cells
}

/** 예전 정사각형 격자 (위쪽 header는 제목 자리) */
export function collageLayout(n: number, size = 1080, header = 140, gap = 12): Cell[] {
  return gridCells(n, { x: gap, y: header, width: size - gap * 2, height: size - header - gap }, gap)
}

/** 템플릿별 사진 칸 (캔버스 1080×1350 기준). 제목 자리는 템플릿마다 다르다. */
export function templateCells(template: CollageTemplate, n: number, width = COLLAGE_WIDTH, height = COLLAGE_HEIGHT): Cell[] {
  const count = Math.max(0, Math.min(maxPhotos(template), n))
  if (count === 0) return []
  switch (template) {
    case 'grid':
      return gridCells(count, { x: 36, y: 200, width: width - 72, height: height - 236 }, 14)
    case 'polaroid': {
      // 2열 × 최대 3줄, 흰 테두리 사진이 번갈아 살짝 기울어진다
      const rotations = [-4, 3, 2, -3, -2, 4]
      const cols = count === 1 ? 1 : 2
      const rows = Math.ceil(count / cols)
      const frameW = count === 1 ? 640 : 440
      const frameH = Math.min(count === 1 ? 760 : 520, (height - 260) / rows - 20)
      const cells: Cell[] = []
      for (let i = 0; i < count; i++) {
        const r = Math.floor(i / cols)
        const c = i % cols
        const inRow = Math.min(cols, count - r * cols)
        const totalW = inRow * frameW + (inRow - 1) * 60
        cells.push({
          x: Math.round((width - totalW) / 2 + c * (frameW + 60)),
          y: Math.round(240 + r * (frameH + 24)),
          width: frameW,
          height: Math.round(frameH),
          rotate: rotations[i],
          captionHeight: 70,
        })
      }
      return cells
    }
    case 'film': {
      // 가운데 세로 필름 띠에 사진을 위에서 아래로 쌓는다
      const top = 210
      const gap = 28
      const frameH = (height - top - 60 - gap * (count - 1)) / count
      return Array.from({ length: count }, (_, i) => ({
        x: 230,
        y: Math.round(top + i * (frameH + gap)),
        width: 620,
        height: Math.round(frameH),
      }))
    }
    case 'magazine': {
      // 첫 장은 위쪽 큰 사진(제목이 그 위에 얹힘), 나머지는 아래 한 줄
      const hero: Cell = { x: 0, y: 0, width, height: count === 1 ? height : 860 }
      if (count === 1) return [hero]
      const rest = gridCells(Math.min(4, count - 1), { x: 36, y: 896, width: width - 72, height: height - 896 - 110 }, 14)
      return [hero, ...rest.map((c) => ({ ...c, height: c.height }))]
    }
  }
}

/** 사진을 칸에 꽉 채우도록 잘라 낼 원본 영역 (object-fit: cover) */
export function coverCrop(imgW: number, imgH: number, cell: { width: number; height: number }) {
  const scale = Math.max(cell.width / imgW, cell.height / imgH)
  const sw = cell.width / scale
  const sh = cell.height / scale
  return { sx: (imgW - sw) / 2, sy: (imgH - sh) / 2, sw, sh }
}

/** 콜라주에 넣을 사진 고르기: 누른 순서대로 번호가 붙고, 다시 누르면 빠진다. 최대 장수를 넘으면 무시. */
export function toggleSelection(order: string[], id: string, max: number): string[] {
  if (order.includes(id)) return order.filter((x) => x !== id)
  return order.length >= max ? order : [...order, id]
}
