import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { ArchiveEntry } from '../archiveStore'
import type { MapData } from '../../data/types'

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: { sanitize: (s: string) => s },
}))

// Mock exportRender
vi.mock('../../storage/exportRender', () => ({
  exportRender: vi.fn(() => '<svg>mock</svg>'),
}))

const emptyMapData: MapData = {
  name: 'Test',
  bounds: { radius: 3 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

function makeEntry(overrides: Partial<ArchiveEntry> = {}): ArchiveEntry {
  return {
    id: crypto.randomUUID(),
    name: 'Test Map',
    mapData: emptyMapData,
    fileHandle: null,
    order: 1,
    ...overrides,
  }
}

// Build an in-memory IDB mock where microtasks are scheduled on each call
function buildFakeIDB(initialData: ArchiveEntry[] = []) {
  const dataStore = new Map<string, ArchiveEntry>(initialData.map((e) => [e.id, { ...e }]))

  const fakeObjectStore = {
    getAll() {
      const req: { onsuccess?: (e: { target: { result: ArchiveEntry[] } }) => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.({ target: { result: Array.from(dataStore.values()) } }))
      return req
    },
    put(entry: ArchiveEntry) {
      dataStore.set(entry.id, { ...entry })
      const req: { onsuccess?: () => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.())
      return req
    },
    delete(id: string) {
      dataStore.delete(id)
      const req: { onsuccess?: () => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.())
      return req
    },
  }

  const fakeDB = {
    transaction: (_name: string, _mode?: string) => ({
      objectStore: (_storeName: string) => fakeObjectStore,
    }),
  }

  vi.stubGlobal('indexedDB', {
    open: (_name: string, _version?: number) => {
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

  return dataStore
}

function buildErrorIDB() {
  vi.stubGlobal('indexedDB', {
    open: (_name: string, _version?: number) => {
      const req: { onsuccess?: () => void; onerror?: (e: Event) => void } = {}
      queueMicrotask(() => req.onerror?.({} as Event))
      return req
    },
  })
}

describe('archiveStore.loadArchive', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads entries sorted by order ascending', async () => {
    const entries = [
      makeEntry({ id: 'a', order: 3 }),
      makeEntry({ id: 'b', order: 1 }),
      makeEntry({ id: 'c', order: 2 }),
    ]
    buildFakeIDB(entries)
    const { useArchiveStore } = await import('../archiveStore')
    const archive = useArchiveStore()
    await archive.loadArchive()
    expect(archive.entries.map((e) => e.order)).toEqual([1, 2, 3])
  })

  it('degrades gracefully when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useArchiveStore } = await import('../archiveStore')
    const archive = useArchiveStore()
    await expect(archive.loadArchive()).resolves.not.toThrow()
    expect(archive.entries).toEqual([])
  })
})

describe('archiveStore.claimSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('inserts a new entry for a new session', async () => {
    buildFakeIDB([])
    const { useArchiveStore } = await import('../archiveStore')
    const { useSessionStore } = await import('../sessionStore')
    const archive = useArchiveStore()
    const session = useSessionStore()
    await archive.loadArchive()
    const s = session.makeSession()
    await archive.claimSession(s)
    expect(archive.entries.some((e) => e.id === s.id)).toBe(true)
  })

  it('updates existing entry without increasing entries.length', async () => {
    buildFakeIDB([])
    const { useArchiveStore } = await import('../archiveStore')
    const { useSessionStore } = await import('../sessionStore')
    const archive = useArchiveStore()
    const session = useSessionStore()
    await archive.loadArchive()
    const s = session.makeSession()
    await archive.claimSession(s)
    const lenAfterFirst = archive.entries.length
    await archive.claimSession(s)
    expect(archive.entries.length).toBe(lenAfterFirst)
  })

  it('stores thumbnail as sanitized SVG', async () => {
    buildFakeIDB([])
    const { useArchiveStore } = await import('../archiveStore')
    const { useSessionStore } = await import('../sessionStore')
    const archive = useArchiveStore()
    const session = useSessionStore()
    await archive.loadArchive()
    const s = session.makeSession()
    await archive.claimSession(s)
    const entry = archive.entries.find((e) => e.id === s.id)!
    expect(entry.thumbnail).toBe('<svg>mock</svg>')
  })

  it('thumbnail failure does not block archive write', async () => {
    const { exportRender } = await import('../../storage/exportRender')
    vi.mocked(exportRender).mockImplementationOnce(() => {
      throw new Error('render failed')
    })
    buildFakeIDB([])
    const { useArchiveStore } = await import('../archiveStore')
    const { useSessionStore } = await import('../sessionStore')
    const archive = useArchiveStore()
    const session = useSessionStore()
    await archive.loadArchive()
    const s = session.makeSession()
    await archive.claimSession(s)
    const entry = archive.entries.find((e) => e.id === s.id)!
    expect(entry).toBeDefined()
    expect(entry.thumbnail).toBeUndefined()
  })
})

describe('archiveStore.deleteEntry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('removes existing entry from entries', async () => {
    const entry = makeEntry({ id: 'del-1', order: 1 })
    buildFakeIDB([entry])
    const { useArchiveStore } = await import('../archiveStore')
    const archive = useArchiveStore()
    await archive.loadArchive()
    await archive.deleteEntry('del-1')
    expect(archive.entries.find((e) => e.id === 'del-1')).toBeUndefined()
  })

  it('is a no-op for non-existent id', async () => {
    buildFakeIDB([makeEntry({ id: 'keep', order: 1 })])
    const { useArchiveStore } = await import('../archiveStore')
    const archive = useArchiveStore()
    await archive.loadArchive()
    const before = archive.entries.length
    await archive.deleteEntry('nonexistent')
    expect(archive.entries.length).toBe(before)
  })
})

describe('archiveStore.moveArchiveEntry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('moves entry to first position', async () => {
    const entries = [
      makeEntry({ id: 'a', order: 1 }),
      makeEntry({ id: 'b', order: 2 }),
      makeEntry({ id: 'c', order: 3 }),
    ]
    buildFakeIDB(entries)
    const { useArchiveStore } = await import('../archiveStore')
    const archive = useArchiveStore()
    await archive.loadArchive()
    await archive.moveArchiveEntry('c', 0)
    expect(archive.entries[0].id).toBe('c')
  })
})
