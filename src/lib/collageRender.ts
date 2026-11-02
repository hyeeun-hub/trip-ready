import { collageLayout, coverCrop } from './collage'

interface CollageInput {
  title: string
  subtitle: string
  photos: Blob[]
  size?: number
}

/** 콜라주 이미지 그리기 (브라우저 전용, TODO 8-3). 1080×1080 JPEG */
export async function renderCollage({ title, subtitle, photos, size = 1080 }: CollageInput): Promise<Blob> {
  const header = 140
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = '#111827'
  ctx.font = "800 52px -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  ctx.fillText(title, 24, 72)
  ctx.fillStyle = '#7c83e6'
  ctx.font = "600 28px -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
  ctx.fillText(subtitle, 26, 116)

  const cells = collageLayout(photos.length, size, header)
  for (let i = 0; i < cells.length; i++) {
    const bitmap = await createImageBitmap(photos[i])
    const cell = cells[i]
    const { sx, sy, sw, sh } = coverCrop(bitmap.width, bitmap.height, cell)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(cell.x, cell.y, cell.width, cell.height, 18)
    ctx.clip()
    ctx.drawImage(bitmap, sx, sy, sw, sh, cell.x, cell.y, cell.width, cell.height)
    ctx.restore()
    bitmap.close()
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('콜라주를 만들지 못했어요'))), 'image/jpeg', 0.9),
  )
}

/** 파일로 저장하기 (브라우저 다운로드) */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
