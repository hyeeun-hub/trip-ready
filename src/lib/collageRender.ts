import { COLLAGE_HEIGHT, COLLAGE_WIDTH, coverCrop, templateCells, type Cell, type CollageTemplate } from './collage'

export interface CollagePhoto {
  bitmap: ImageBitmap
  caption: string
}

export interface CollageOptions {
  template: CollageTemplate
  title: string
  subtitle: string
  background: string
  showCaptions: boolean
  photos: CollagePhoto[]
}

/** 배경색 고르기 (TODO 10-2) */
export const BACKGROUNDS = ['#ffffff', '#f6f1e9', '#eef0fd', '#fde8e4', '#1f2937']

const FONT = "-apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"

/** 배경이 어두우면 흰 글씨 */
function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b < 140
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
  return `${t}…`
}

function drawPhoto(ctx: CanvasRenderingContext2D, bitmap: ImageBitmap, cell: Pick<Cell, 'x' | 'y' | 'width' | 'height'>, radius: number) {
  const { sx, sy, sw, sh } = coverCrop(bitmap.width, bitmap.height, cell)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(cell.x, cell.y, cell.width, cell.height, radius)
  ctx.clip()
  ctx.drawImage(bitmap, sx, sy, sw, sh, cell.x, cell.y, cell.width, cell.height)
  ctx.restore()
}

/** 사진 위 아래쪽에 어두운 그라데이션 + 흰 글씨 */
function overlayCaption(ctx: CanvasRenderingContext2D, text: string, cell: Cell, size: number, radius: number) {
  if (!text) return
  const h = Math.min(cell.height * 0.45, size * 3.2)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(cell.x, cell.y, cell.width, cell.height, radius)
  ctx.clip()
  const g = ctx.createLinearGradient(0, cell.y + cell.height - h, 0, cell.y + cell.height)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = g
  ctx.fillRect(cell.x, cell.y + cell.height - h, cell.width, h)
  ctx.fillStyle = '#fff'
  ctx.font = `600 ${size}px ${FONT}`
  ctx.fillText(fitText(ctx, text, cell.width - size * 1.4), cell.x + size * 0.7, cell.y + cell.height - size * 0.7)
  ctx.restore()
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string, subtitle: string, color: string, accent: string, align: CanvasTextAlign, x: number, y: number, size: number) {
  ctx.textAlign = align
  ctx.fillStyle = color
  ctx.font = `800 ${size}px ${FONT}`
  ctx.fillText(fitText(ctx, title, COLLAGE_WIDTH - 96), x, y)
  ctx.fillStyle = accent
  ctx.font = `600 ${Math.round(size * 0.48)}px ${FONT}`
  ctx.fillText(fitText(ctx, subtitle, COLLAGE_WIDTH - 96), x, y + size * 0.78)
  ctx.textAlign = 'left'
}

/** 콜라주 그리기 (브라우저 전용, TODO 8-3·10-2). 캔버스 크기는 1080×1350. */
export function drawCollage(canvas: HTMLCanvasElement, o: CollageOptions): void {
  canvas.width = COLLAGE_WIDTH
  canvas.height = COLLAGE_HEIGHT
  const ctx = canvas.getContext('2d')!
  const dark = isDark(o.background)
  const ink = dark ? '#ffffff' : '#111827'
  const accent = dark ? '#c7cbf5' : '#7c83e6'
  ctx.fillStyle = o.background
  ctx.fillRect(0, 0, COLLAGE_WIDTH, COLLAGE_HEIGHT)
  const cells = templateCells(o.template, o.photos.length)
  const caption = (i: number) => (o.showCaptions ? o.photos[i].caption : '')

  if (o.template === 'grid') {
    drawTitle(ctx, o.title, o.subtitle, ink, accent, 'left', 48, 112, 64)
    cells.forEach((cell, i) => {
      drawPhoto(ctx, o.photos[i].bitmap, cell, 22)
      overlayCaption(ctx, caption(i), cell, cells.length > 4 ? 22 : 28, 22)
    })
  }

  if (o.template === 'polaroid') {
    drawTitle(ctx, o.title, o.subtitle, ink, accent, 'center', COLLAGE_WIDTH / 2, 130, 72)
    cells.forEach((cell, i) => {
      const cx = cell.x + cell.width / 2
      const cy = cell.y + cell.height / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(((cell.rotate ?? 0) * Math.PI) / 180)
      ctx.translate(-cx, -cy)
      ctx.shadowColor = 'rgba(0,0,0,0.18)'
      ctx.shadowBlur = 24
      ctx.shadowOffsetY = 8
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cell.x, cell.y, cell.width, cell.height)
      ctx.shadowColor = 'transparent'
      const pad = 22
      const photo = { x: cell.x + pad, y: cell.y + pad, width: cell.width - pad * 2, height: cell.height - pad - (cell.captionHeight ?? 70) }
      drawPhoto(ctx, o.photos[i].bitmap, photo, 4)
      const text = caption(i)
      if (text) {
        ctx.fillStyle = '#374151'
        ctx.font = `600 28px ${FONT}`
        ctx.textAlign = 'center'
        ctx.fillText(fitText(ctx, text, photo.width), cx, cell.y + cell.height - (cell.captionHeight ?? 70) / 2 + 6)
        ctx.textAlign = 'left'
      }
      ctx.restore()
    })
  }

  if (o.template === 'film') {
    drawTitle(ctx, o.title, o.subtitle, ink, accent, 'center', COLLAGE_WIDTH / 2, 110, 60)
    const strip = { x: 170, y: 180, width: 740, height: COLLAGE_HEIGHT - 210 }
    ctx.fillStyle = '#111111'
    ctx.beginPath()
    ctx.roundRect(strip.x, strip.y, strip.width, strip.height, 10)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (let y = strip.y + 18; y < strip.y + strip.height - 24; y += 46) {
      for (const x of [strip.x + 16, strip.x + strip.width - 40]) {
        ctx.beginPath()
        ctx.roundRect(x, y, 24, 18, 4)
        ctx.fill()
      }
    }
    cells.forEach((cell, i) => {
      drawPhoto(ctx, o.photos[i].bitmap, cell, 6)
      overlayCaption(ctx, caption(i), cell, 26, 6)
    })
  }

  if (o.template === 'magazine') {
    const [hero, ...rest] = cells
    drawPhoto(ctx, o.photos[0].bitmap, hero, 0)
    const g = ctx.createLinearGradient(0, hero.height * 0.45, 0, hero.height)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.65)')
    ctx.fillStyle = g
    ctx.fillRect(0, hero.height * 0.45, COLLAGE_WIDTH, hero.height * 0.55)
    drawTitle(ctx, o.title, o.subtitle, '#ffffff', '#e0e3fb', 'left', 56, hero.height - (caption(0) ? 150 : 100), 92)
    if (caption(0)) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = `500 30px ${FONT}`
      ctx.fillText(fitText(ctx, `“${caption(0)}”`, COLLAGE_WIDTH - 112), 56, hero.height - 40)
    }
    rest.forEach((cell, i) => {
      drawPhoto(ctx, o.photos[i + 1].bitmap, cell, 18)
      overlayCaption(ctx, caption(i + 1), cell, 22, 18)
    })
    if (rest.length > 0) {
      ctx.fillStyle = accent
      ctx.font = `700 26px ${FONT}`
      ctx.fillText('TRIP JOURNAL', 40, COLLAGE_HEIGHT - 48)
    }
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('콜라주를 만들지 못했어요'))), 'image/jpeg', 0.92),
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
