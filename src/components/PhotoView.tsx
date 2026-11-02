import { indexedDbPhotos } from '../lib/photoStore'
import { useAsync } from '../lib/useAsync'

/** IndexedDB에 저장한 기록 사진 보여주기 */
export function PhotoView({ photoId, className, alt }: { photoId: string; className: string; alt: string }) {
  const photo = useAsync(`photo:${photoId}`, async () => {
    const blob = await indexedDbPhotos.get(photoId)
    return blob ? URL.createObjectURL(blob) : null
  })
  if (photo.status !== 'done' || !photo.data) return <span className={`${className} photo-missing`}>📷</span>
  return <img className={className} src={photo.data} alt={alt} loading="lazy" />
}
