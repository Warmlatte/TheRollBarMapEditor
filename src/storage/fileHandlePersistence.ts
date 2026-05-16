const DB_NAME = 'hexmap.fileHandles'
const STORE_NAME = 'handles'
const DB_VERSION = 1

type HandleEntry = {
  sessionId: string
  handle: FileSystemFileHandle
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' })
      }
    }
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveHandle(
  sessionId: string,
  handle: FileSystemFileHandle | null,
): Promise<void> {
  if (handle === null) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const entry: HandleEntry = { sessionId, handle }
      const req = tx.objectStore(STORE_NAME).put(entry)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // IndexedDB unavailable — silently fail
  }
}

export async function loadHandle(sessionId: string): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB()
    return await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(sessionId)
      req.onsuccess = (event) => {
        const entry = (event.target as IDBRequest<HandleEntry | undefined>).result
        resolve(entry?.handle ?? null)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function removeHandle(sessionId: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).delete(sessionId)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // IndexedDB unavailable or key not found — no-op
  }
}
