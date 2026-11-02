/** 콜라주 칸 하나 (픽셀) */
export interface Cell {
  x: number
  y: number
  width: number
  height: number
}

export const MAX_COLLAGE_PHOTOS = 9

/**
 * 사진 n장(1~9)을 정사각형 캔버스에 배치하는 칸 (TODO 8-3).
 * 위쪽 header 높이는 제목 자리로 비워 두고, 칸 사이와 가장자리는 gap만큼 띄운다.
 * 1장은 꽉 차게, 2~4장은 2열, 5~9장은 3열. 마지막 줄이 덜 차면 그 줄 칸을 넓혀 빈칸이 없게 한다.
 */
export function collageLayout(n: number, size = 1080, header = 140, gap = 12): Cell[] {
  const count = Math.max(0, Math.min(MAX_COLLAGE_PHOTOS, n))
  if (count === 0) return []
  const cols = count === 1 ? 1 : count <= 4 ? 2 : 3
  const rows = Math.ceil(count / cols)
  const innerW = size - gap * 2
  const innerH = size - header - gap
  const rowH = (innerH - gap * (rows - 1)) / rows
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, count - r * cols)
    const cellW = (innerW - gap * (inRow - 1)) / inRow
    for (let c = 0; c < inRow; c++) {
      cells.push({
        x: Math.round(gap + c * (cellW + gap)),
        y: Math.round(header + r * (rowH + gap)),
        width: Math.round(cellW),
        height: Math.round(rowH),
      })
    }
  }
  return cells
}

/** 사진을 칸에 꽉 채우도록 잘라 낼 원본 영역 (object-fit: cover) */
export function coverCrop(imgW: number, imgH: number, cell: { width: number; height: number }) {
  const scale = Math.max(cell.width / imgW, cell.height / imgH)
  const sw = cell.width / scale
  const sh = cell.height / scale
  return { sx: (imgW - sw) / 2, sy: (imgH - sh) / 2, sw, sh }
}
