/**
 * 기록 사진 저장소 (TODO 8-2). localStorage는 5MB 정도라 사진을 넣을 수 없어 브라우저의 IndexedDB를 쓴다.
 * 테스트에서는 같은 모양의 메모리 저장소를 넣는다.
 */
export interface PhotoStore {
  put(id: string, blob: Blob): Promise<void>
  get(id: string): Promise<Blob | undefined>
  delete(id: string): Promise<void>
}

const DB_NAME = 'tripready-photos'
const STORE = 'photos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = work(tx.objectStore(STORE))
        tx.oncomplete = () => {
          db.close()
          resolve(req.result as T)
        }
        tx.onerror = () => reject(tx.error)
      }),
  )
}

export const indexedDbPhotos: PhotoStore = {
  put: (id, blob) => run<void>('readwrite', (s) => s.put(blob, id)),
  get: (id) => run<Blob | undefined>('readonly', (s) => s.get(id)),
  delete: (id) => run<void>('readwrite', (s) => s.delete(id)),
}

export function memoryPhotos(): PhotoStore & { size: () => number } {
  const data = new Map<string, Blob>()
  return {
    put: async (id, blob) => void data.set(id, blob),
    get: async (id) => data.get(id),
    delete: async (id) => void data.delete(id),
    size: () => data.size,
  }
}
