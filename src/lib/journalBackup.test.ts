import { describe, expect, it } from 'vitest'
import { sampleTrip } from '../test/fixtures'
import type { JournalEntry } from '../types'
import { deleteTripPhotos, exportJournal, importJournal } from './journalBackup'
import { memoryPhotos } from './photoStore'

const lunch: JournalEntry = { id: 'e1', date: '2026-12-01', slot: 'lunch', caption: '라멘', photoId: 'p1', createdAt: '2026-12-01T03:00:00.000Z' }
const note: JournalEntry = { id: 'e2', date: '2026-12-02', slot: 'other', caption: '비 옴', createdAt: '2026-12-02T09:00:00.000Z' }

describe('기록 내보내기·불러오기 (8-2)', () => {
  it('내보낸 파일을 다른 기기(빈 저장소)에서 불러오면 기록과 사진이 그대로 돌아온다', async () => {
    const here = memoryPhotos()
    const photo = new Blob([new Uint8Array([255, 216, 255, 1, 2, 3])], { type: 'image/jpeg' })
    await here.put('p1', photo)
    const file = await exportJournal(sampleTrip({ journal: [lunch, note] }), here)

    const there = memoryPhotos()
    const { trip, added } = await importJournal(sampleTrip(), file, there)
    expect(added).toBe(2)
    expect(trip.journal).toEqual([lunch, note])
    const restored = await there.get('p1')
    expect(restored?.type).toBe('image/jpeg')
    expect(new Uint8Array(await restored!.arrayBuffer())).toEqual(new Uint8Array([255, 216, 255, 1, 2, 3]))
  })

  it('이미 있는 기록은 다시 넣지 않는다', async () => {
    const file = await exportJournal(sampleTrip({ journal: [note] }), memoryPhotos())
    const { added } = await importJournal(sampleTrip({ journal: [note] }), file, memoryPhotos())
    expect(added).toBe(0)
  })

  it('다른 파일이나 깨진 파일은 거부한다', async () => {
    await expect(importJournal(sampleTrip(), '{oops', memoryPhotos())).rejects.toThrow('여행 준비 기록 파일이 아니에요.')
    await expect(importJournal(sampleTrip(), '{"format":"other"}', memoryPhotos())).rejects.toThrow('여행 준비 기록 파일이 아니에요.')
  })

  it('여행을 지우면 그 여행 사진도 지운다', async () => {
    const photos = memoryPhotos()
    await photos.put('p1', new Blob(['x']))
    await photos.put('other', new Blob(['y']))
    await deleteTripPhotos(sampleTrip({ journal: [lunch, note] }), photos)
    expect(photos.size()).toBe(1)
  })
})
