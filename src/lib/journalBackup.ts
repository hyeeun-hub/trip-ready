import type { JournalEntry, Trip } from '../types'
import { isISODate } from './date'
import { journalOf, SLOTS } from './journal'
import type { PhotoStore } from './photoStore'

/** 기록 내보내기 파일 형식 (TODO 8-2). 사진은 data URL로 함께 넣어 파일 하나로 옮길 수 있다. */
interface BackupFile {
  format: 'tripready-journal'
  version: 1
  city: string
  entries: JournalEntry[]
  photos: Record<string, string>
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error('사진 형식이 올바르지 않아요.')
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: match[1] })
}

export async function exportJournal(trip: Trip, photos: PhotoStore): Promise<string> {
  const entries = journalOf(trip)
  const data: BackupFile = { format: 'tripready-journal', version: 1, city: trip.city.name, entries, photos: {} }
  for (const e of entries) {
    if (!e.photoId) continue
    const blob = await photos.get(e.photoId)
    if (blob) data.photos[e.photoId] = await blobToDataUrl(blob)
  }
  return JSON.stringify(data)
}

function isEntry(value: unknown): value is JournalEntry {
  const e = value as Partial<JournalEntry>
  return typeof e?.id === 'string' && isISODate(e.date) && SLOTS.includes(e.slot as JournalEntry['slot']) && typeof e.caption === 'string'
}

/** 불러오기: 사진을 저장소에 넣고, 이미 있는 기록(id 같음)은 건너뛴다. 추가된 기록 수를 돌려준다. */
export async function importJournal(trip: Trip, text: string, photos: PhotoStore): Promise<{ trip: Trip; added: number }> {
  let data: BackupFile
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('여행 준비 기록 파일이 아니에요.')
  }
  if (data?.format !== 'tripready-journal' || !Array.isArray(data.entries)) throw new Error('여행 준비 기록 파일이 아니에요.')
  const existing = new Set(journalOf(trip).map((e) => e.id))
  const incoming = data.entries.filter(isEntry).filter((e) => !existing.has(e.id))
  for (const e of incoming) {
    const dataUrl = e.photoId ? data.photos?.[e.photoId] : undefined
    if (e.photoId && dataUrl) await photos.put(e.photoId, dataUrlToBlob(dataUrl))
  }
  return { trip: { ...trip, journal: [...journalOf(trip), ...incoming] }, added: incoming.length }
}

/** 여행을 지울 때 그 여행 기록의 사진도 지운다 */
export async function deleteTripPhotos(trip: Trip, photos: PhotoStore): Promise<void> {
  for (const e of journalOf(trip)) if (e.photoId) await photos.delete(e.photoId)
}
