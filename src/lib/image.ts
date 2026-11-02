/** 긴 변이 max를 넘지 않게 비율을 유지해 줄인 크기 (TODO 8-2). 작은 사진은 키우지 않는다. */
export function fitSize(width: number, height: number, max = 1280): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** 사진 파일을 줄여 JPEG로 (브라우저 전용). 휴대폰 사진(4000px, 3~5MB)이 200KB 안팎이 된다. */
export async function resizePhoto(file: Blob, max = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = fitSize(bitmap.width, bitmap.height, max)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('사진을 줄이지 못했어요'))), 'image/jpeg', quality),
  )
}
