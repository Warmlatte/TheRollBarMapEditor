import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { IconEntry } from '../iconLibraryStore'

vi.mock('../../storage/svgNormalize', () => ({
  sanitizeSvgIcon: vi.fn((s: string) =>
    s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''),
  ),
  normalizeSvgIcon: vi.fn((s: string) => s),
}))

type FailOp = 'put' | 'delete' | 'getAll'

function buildFakeIDB(initialData: IconEntry[] = [], failOps: Set<FailOp> = new Set()) {
  const dataStore = new Map<string, IconEntry>(initialData.map((e) => [e.id, { ...e }]))

  const fakeObjectStore = {
    getAll() {
      const req: { onsuccess?: (e: { target: { result: IconEntry[] } }) => void; onerror?: () => void } = {}
      if (failOps.has('getAll')) {
        queueMicrotask(() => req.onerror?.())
      } else {
        queueMicrotask(() => req.onsuccess?.({ target: { result: Array.from(dataStore.values()) } }))
      }
      return req
    },
    get(id: string) {
      const req: { onsuccess?: (e: { target: { result: IconEntry | undefined } }) => void; onerror?: () => void } = {}
      queueMicrotask(() => req.onsuccess?.({ target: { result: dataStore.get(id) } }))
      return req
    },
    put(entry: IconEntry) {
      const req: { onsuccess?: () => void; onerror?: () => void } = {}
      if (failOps.has('put')) {
        queueMicrotask(() => req.onerror?.())
      } else {
        dataStore.set(entry.id, { ...entry })
        queueMicrotask(() => req.onsuccess?.())
      }
      return req
    },
    delete(id: string) {
      const req: { onsuccess?: () => void; onerror?: () => void } = {}
      if (failOps.has('delete')) {
        queueMicrotask(() => req.onerror?.())
      } else {
        dataStore.delete(id)
        queueMicrotask(() => req.onsuccess?.())
      }
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

  it('seeds the default SVG icons when IndexedDB is empty', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    expect(store.icons.map((e) => e.id)).toEqual(['mountain', 'tree', 'tower', 'skull'])
    expect(store.icons.every((e) => e.rawSvg.startsWith('<svg'))).toBe(true)
  })

  it('rejects when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.loadIcons()).rejects.toThrow()
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

  it('stores original rawSvg without sanitizing before persist', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    const original = '<svg><script>alert(1)</script></svg>'
    await store.loadIcons()
    await store.addIcon(original, 'bad')
    await store.loadIcons()
    const entry = store.icons.find((e) => e.name === 'bad')!
    expect(entry.rawSvg).toBe(original)
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

  it('rejects when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.addIcon('<svg/>', 'test')).rejects.toThrow()
  })

  it('rejects and does not add entry when SVG sanitization produces empty output', async () => {
    buildFakeIDB()
    const { sanitizeSvgIcon } = await import('../../storage/svgNormalize')
    vi.mocked(sanitizeSvgIcon).mockReturnValueOnce('')
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await expect(store.addIcon('<garbage>', 'bad')).rejects.toThrow()
    expect(store.icons.some((e) => e.name === 'bad')).toBe(false)
  })

  it('rejects and does not add entry when SVG sanitization throws', async () => {
    buildFakeIDB()
    const { sanitizeSvgIcon } = await import('../../storage/svgNormalize')
    vi.mocked(sanitizeSvgIcon).mockImplementationOnce(() => {
      throw new Error('Invalid SVG')
    })
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await expect(store.addIcon('not svg', 'bad')).rejects.toThrow('Invalid SVG: Invalid SVG')
    expect(store.icons.some((e) => e.name === 'bad')).toBe(false)
  })

  it('rejects when IDB put operation fails', async () => {
    const initial: IconEntry[] = [{ id: 'a', rawSvg: '<svg/>', name: 'alpha', createdAt: 1000 }]
    buildFakeIDB(initial, new Set<FailOp>(['put']))
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await expect(store.addIcon('<svg/>', 'test')).rejects.toThrow()
  })

  it('resolves to the newly created entry whose id matches the icons list', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    const entry = await store.addIcon('<svg/>', 'sword')
    const inList = store.icons.find((e) => e.name === 'sword')!
    expect(entry).toBeDefined()
    expect(entry.id).toBe(inList.id)
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

  it('rejects when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.deleteIcon('any-id')).rejects.toThrow()
  })

  it('rejects when IDB delete operation fails', async () => {
    buildFakeIDB([], new Set<FailOp>(['delete']))
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await expect(store.deleteIcon('any-id')).rejects.toThrow()
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

  it('rejects on unknown id', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await expect(store.updateIcon('nonexistent', { name: 'x' })).rejects.toThrow()
    expect(store.icons.some((e) => e.id === 'nonexistent')).toBe(false)
  })

  it('does not allow patching the id field', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    await store.addIcon('<svg/>', 'sword')
    await store.loadIcons()
    const before = store.icons.find((e) => e.name === 'sword')!
    await store.updateIcon(before.id, { id: 'hacked-id' } as unknown as Partial<Omit<IconEntry, 'id'>>)
    const after = store.icons.find((e) => e.name === 'sword')!
    expect(after.id).toBe(before.id)
  })

  it('rejects when IndexedDB is unavailable', async () => {
    buildErrorIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await expect(store.updateIcon('any-id', { name: 'x' })).rejects.toThrow()
  })

  it('rejects when IDB put operation fails during update', async () => {
    buildFakeIDB([], new Set<FailOp>(['put']))
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const initial: IconEntry[] = [{ id: 'a', rawSvg: '<svg/>', name: 'alpha', createdAt: 1000 }]
    buildFakeIDB(initial, new Set<FailOp>(['put']))
    const store = useIconLibraryStore()
    await store.loadIcons()
    await expect(store.updateIcon('a', { name: 'beta' })).rejects.toThrow()
  })
})

describe('iconLibraryStore — default seed colors', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('seeds mountain icon with defaultColor #7a7a7a', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    const mountain = store.icons.find((e) => e.id === 'mountain')!
    expect(mountain.defaultColor).toBe('#7a7a7a')
  })

  it('seeds tree icon with defaultColor #4a7a3a', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    const tree = store.icons.find((e) => e.id === 'tree')!
    expect(tree.defaultColor).toBe('#4a7a3a')
  })

  it('seeds tower icon with defaultColor #7a4a2a', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    const tower = store.icons.find((e) => e.id === 'tower')!
    expect(tower.defaultColor).toBe('#7a4a2a')
  })

  it('seeds skull icon with defaultColor #c33232', async () => {
    buildFakeIDB()
    const { useIconLibraryStore } = await import('../iconLibraryStore')
    const store = useIconLibraryStore()
    await store.loadIcons()
    const skull = store.icons.find((e) => e.id === 'skull')!
    expect(skull.defaultColor).toBe('#c33232')
  })
})

describe('getDisplaySvg', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('applies sanitizeSvgIcon then normalizeSvgIcon and does not return script tags', async () => {
    const { getDisplaySvg } = await import('../iconLibraryStore')
    const { sanitizeSvgIcon, normalizeSvgIcon } = await import('../../storage/svgNormalize')
    const raw = '<svg><script>alert(1)</script></svg>'
    const result = getDisplaySvg(raw)
    expect(sanitizeSvgIcon).toHaveBeenCalledWith(raw)
    expect(normalizeSvgIcon).toHaveBeenCalled()
    expect(result).not.toContain('<script>')
  })

  it('returns empty string when rawSvg is undefined (corrupted IndexedDB entry)', async () => {
    const { getDisplaySvg } = await import('../iconLibraryStore')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getDisplaySvg(undefined as any)).toBe('')
  })

  it('returns empty string when rawSvg is empty string', async () => {
    const { getDisplaySvg } = await import('../iconLibraryStore')
    expect(getDisplaySvg('')).toBe('')
  })
})
