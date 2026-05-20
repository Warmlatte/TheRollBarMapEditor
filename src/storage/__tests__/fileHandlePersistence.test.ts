import { describe, it, expect, afterEach, vi } from 'vitest'
import { saveHandle, loadHandle, removeHandle } from '../fileHandlePersistence'

type HandleEntry = { sessionId: string; handle: FileSystemFileHandle }

function makeHandle(name = 'test.trbm'): FileSystemFileHandle {
  return { name } as FileSystemFileHandle
}

function buildFakeIDB(initialData: HandleEntry[] = []) {
  const store = new Map<string, FileSystemFileHandle>(
    initialData.map((e) => [e.sessionId, e.handle]),
  )

  const fakeObjectStore = {
    put(entry: HandleEntry) {
      store.set(entry.sessionId, entry.handle)
      const req: { onsuccess?: () => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.())
      return req
    },
    get(key: string) {
      const found = store.get(key)
      const req: {
        onsuccess?: (e: { target: { result: HandleEntry | undefined } }) => void
        onerror?: () => void
      } = {}
      queueMicrotask(() =>
        req.onsuccess?.({
          target: {
            result: found !== undefined ? { sessionId: key, handle: found } : undefined,
          },
        }),
      )
      return req
    },
    delete(key: string) {
      store.delete(key)
      const req: { onsuccess?: () => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.())
      return req
    },
  }

  const fakeDB = {
    objectStoreNames: { contains: () => true },
    createObjectStore: vi.fn(),
    transaction: () => ({ objectStore: () => fakeObjectStore }),
  }

  vi.stubGlobal('indexedDB', {
    open: () => {
      const req: {
        onsuccess?: (e: { target: { result: typeof fakeDB } }) => void
        onupgradeneeded?: (e: IDBVersionChangeEvent) => void
        onerror?: (e: Event) => void
        result?: typeof fakeDB
      } = {}
      req.result = fakeDB
      queueMicrotask(() => req.onsuccess?.({ target: { result: fakeDB } }))
      return req
    },
  })

  return store
}

function buildErrorIDB() {
  vi.stubGlobal('indexedDB', {
    open: () => {
      const req: { onsuccess?: () => void; onerror?: (e: Event) => void } = {}
      queueMicrotask(() => req.onerror?.({} as Event))
      return req
    },
  })
}

describe('fileHandlePersistence', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('saveHandle', () => {
    it('persists a non-null handle so loadHandle can retrieve it', async () => {
      buildFakeIDB()
      const handle = makeHandle()
      await saveHandle('session-1', handle)
      const loaded = await loadHandle('session-1')
      expect(loaded).toBe(handle)
    })

    it('is a no-op when handle is null — loadHandle returns null', async () => {
      buildFakeIDB()
      await saveHandle('session-1', null)
      const loaded = await loadHandle('session-1')
      expect(loaded).toBeNull()
    })
  })

  describe('loadHandle', () => {
    it('returns stored handle for known sessionId', async () => {
      const handle = makeHandle()
      buildFakeIDB([{ sessionId: 'session-1', handle }])
      const loaded = await loadHandle('session-1')
      expect(loaded).toBe(handle)
    })

    it('returns null for unknown sessionId', async () => {
      buildFakeIDB()
      const result = await loadHandle('unknown-session')
      expect(result).toBeNull()
    })

    it('returns null when IndexedDB is unavailable', async () => {
      buildErrorIDB()
      const result = await loadHandle('session-1')
      expect(result).toBeNull()
    })
  })

  describe('removeHandle', () => {
    it('removes handle so loadHandle returns null afterwards', async () => {
      const handle = makeHandle()
      buildFakeIDB([{ sessionId: 'session-1', handle }])
      await removeHandle('session-1')
      const loaded = await loadHandle('session-1')
      expect(loaded).toBeNull()
    })

    it('does not throw for unknown sessionId', async () => {
      buildFakeIDB()
      await expect(removeHandle('non-existent')).resolves.toBeUndefined()
    })

    it('returns null from loadHandle when IndexedDB is unavailable', async () => {
      buildErrorIDB()
      await expect(loadHandle('session-1')).resolves.toBeNull()
    })
  })
})
