import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { IconEntry } from '../iconLibraryStore'

vi.mock('../../storage/svgNormalize', () => ({
  sanitizeSvgIcon: vi.fn((s: string) =>
    s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''),
  ),
  normalizeSvgIcon: vi.fn((s: string) => s),
}))

function buildFakeIDB(initialData: IconEntry[] = []) {
  const dataStore = new Map<string, IconEntry>(initialData.map((e) => [e.id, { ...e }]))

  const fakeObjectStore = {
    getAll() {
      const req: { onsuccess?: (e: { target: { result: IconEntry[] } }) => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.({ target: { result: Array.from(dataStore.values()) } }))
      return req
    },
    get(id: string) {
      const req: { onsuccess?: (e: { target: { result: IconEntry | undefined } }) => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.({ target: { result: dataStore.get(id) } }))
      return req
    },
    put(entry: IconEntry) {
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
    objectStoreNames: { contains: () => true },
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

describe('iconLibraryStore.loadIcons', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads all entries from IndexedDB', async () => {
    const initial: IconEntry[] = [
      { id: 'a', rawSvg: '<svg/>', name: 'alpha', createdAt: 1000 },
      { id: 'b', rawSvg: '<svg/>', name: 'beta', createdAt: 2000 },
    ]
    buildFakeIDB(initial)
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    expect(store.icons).toHaveLength(2)
    expect(store.icons.map((e) => e.name)).toContain('alpha')
  })

  it('degrades gracefully when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.loadIcons()).resolves.not.toThrow()
    expect(store.icons).toEqual([])
  })
})

describe('iconLibraryStore.addIcon', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('addIcon followed by loadIcons contains new entry', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await store.addIcon('<svg/>', 'sword')
    await store.loadIcons()
    expect(store.icons.some((e) => e.name === 'sword')).toBe(true)
  })

  it('stores original rawSvg (not sanitized)', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    const malicious = '<svg><script>alert(1)</script></svg>'
    await store.loadIcons()
    await store.addIcon(malicious, 'bad')
    await store.loadIcons()
    const entry = store.icons.find((e) => e.name === 'bad')!
    expect(entry.rawSvg).toBe(malicious)
  })

  it('sanitizeSvgIcon called with the rawSvg removes <script> from result', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    const malicious = '<svg><script>alert(1)</script></svg>'
    await store.loadIcons()
    await store.addIcon(malicious, 'bad')
    await store.loadIcons()
    const entry = store.icons.find((e) => e.name === 'bad')!
    const { sanitizeSvgIcon } = await import('../../storage/svgNormalize')
    expect(sanitizeSvgIcon(entry.rawSvg)).not.toContain('<script>')
  })

  it('generated entry has id (uuid) and createdAt (timestamp)', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await store.addIcon('<svg/>', 'test')
    const entry = store.icons.find((e) => e.name === 'test')!
    expect(typeof entry.id).toBe('string')
    expect(entry.id.length).toBeGreaterThan(0)
    expect(typeof entry.createdAt).toBe('number')
    expect(entry.createdAt).toBeGreaterThan(0)
  })

  it('does not throw when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.addIcon('<svg/>', 'test')).resolves.not.toThrow()
  })
})

describe('iconLibraryStore.deleteIcon', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('deleteIcon removes the entry from icons', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await store.addIcon('<svg/>', 'sword')
    await store.loadIcons()
    const icon = store.icons.find((e) => e.name === 'sword')!
    await store.deleteIcon(icon.id)
    expect(store.icons.find((e) => e.id === icon.id)).toBeUndefined()
  })

  it('subsequent loadIcons does not include deleted entry', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await store.addIcon('<svg/>', 'sword')
    await store.loadIcons()
    const icon = store.icons.find((e) => e.name === 'sword')!
    await store.deleteIcon(icon.id)
    await store.loadIcons()
    expect(store.icons.find((e) => e.id === icon.id)).toBeUndefined()
  })

  it('does not throw when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.deleteIcon('any-id')).resolves.not.toThrow()
  })
})

describe('iconLibraryStore.updateIcon', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('updateIcon only changes patch fields, preserves others', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await store.addIcon('<svg/>', 'sword')
    await store.loadIcons()
    const before = store.icons.find((e) => e.name === 'sword')!
    await store.updateIcon(before.id, { name: 'shield' })
    const after = store.icons.find((e) => e.id === before.id)!
    expect(after.name).toBe('shield')
    expect(after.rawSvg).toBe('<svg/>')
    expect(after.createdAt).toBe(before.createdAt)
  })

  it('unknown id updateIcon is a no-op without throwing', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await expect(store.updateIcon('nonexistent', { name: 'x' })).resolves.not.toThrow()
    expect(store.icons).toHaveLength(0)
  })

  it('does not throw when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.updateIcon('any-id', { name: 'x' })).resolves.not.toThrow()
  })
})
