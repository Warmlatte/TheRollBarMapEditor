import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import App from './App.vue'
import { useSessionStore } from './stores/sessionStore'
import { useMapStore } from './stores/mapStore'
import { useIconLibraryStore } from './stores/iconLibraryStore'
import { useBrushStore } from './stores/brushStore'
import { loadWorkspace } from './storage/persist'
import type { MapData } from './data/types'

vi.mock('./components/FloatingToolbar.vue', () => ({
  default: { template: '<div data-test="toolbar" />' },
}))

vi.mock('./storage/persist', () => ({
  loadWorkspace: vi.fn(),
}))

vi.mock('./storage/fileHandlePersistence', () => ({
  loadHandle: vi.fn(async () => null),
}))

const mapData: MapData = {
  name: 'Restored Map',
  bounds: { radius: 3 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

const alternateMapData: MapData = {
  name: 'Alternate Map',
  bounds: { radius: 2 },
  hexes: [{ q: 0, r: 0, color: '#00ff00' }],
  icons: [],
  lines: [],
  doodles: [],
}

function stubIndexedDB(): void {
  const entries = new Map<string, unknown>()
  const fakeObjectStore = {
    getAll() {
      const req: { onsuccess?: (e: { target: { result: unknown[] } }) => void } = {}
      queueMicrotask(() => req.onsuccess?.({ target: { result: Array.from(entries.values()) } }))
      return req
    },
    put(entry: { id: string }) {
      const req: { onsuccess?: () => void } = {}
      entries.set(entry.id, { ...entry })
      queueMicrotask(() => req.onsuccess?.())
      return req
    },
  }
  const fakeDB = {
    objectStoreNames: { contains: () => true },
    transaction: () => ({
      objectStore: () => fakeObjectStore,
    }),
  }
  vi.stubGlobal('indexedDB', {
    open: () => {
      const req: { onsuccess?: (e: { target: { result: typeof fakeDB } }) => void } = {}
      queueMicrotask(() => req.onsuccess?.({ target: { result: fakeDB } }))
      return req
    },
  })
}

describe('App workspace restore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    stubIndexedDB()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('replaces the preexisting blank session with restored workspace tabs', async () => {
    vi.mocked(loadWorkspace).mockReturnValue({
      tabs: [{ id: 'restored-1', name: 'Restored Map', mapData }],
      activeTabId: 'restored-1',
    })

    const sessionStore = useSessionStore()
    sessionStore.makeSession()

    mount(App)
    await flushPromises()

    expect(sessionStore.sessions.map((session) => session.id)).toEqual(['restored-1'])
    expect(sessionStore.activeId).toBe('restored-1')
  })

  it('loads active session mapData into mapStore after restore', async () => {
    vi.mocked(loadWorkspace).mockReturnValue({
      tabs: [{ id: 'tab-1', name: 'Restored Map', mapData }],
      activeTabId: 'tab-1',
    })

    const mapStore = useMapStore()
    mount(App)
    await flushPromises()

    expect(mapStore.mapData).toEqual(mapData)
    expect(mapStore.canUndo).toBe(false)
  })

  it('loads mapData when active session changes after mount', async () => {
    vi.mocked(loadWorkspace).mockReturnValue({
      tabs: [
        { id: 'tab-1', name: 'Restored Map', mapData },
        { id: 'tab-2', name: 'Alternate Map', mapData: alternateMapData },
      ],
      activeTabId: 'tab-1',
    })

    const sessionStore = useSessionStore()
    const mapStore = useMapStore()
    mount(App)
    await flushPromises()

    sessionStore.setActive('tab-2')
    await flushPromises()

    expect(mapStore.mapData).toEqual(alternateMapData)
    expect(mapStore.canUndo).toBe(false)
  })
})

describe('App workspace restore — no workspace', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    stubIndexedDB()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates initial session when no workspace exists', async () => {
    vi.mocked(loadWorkspace).mockReturnValue(null)
    const sessionStore = useSessionStore()

    mount(App)
    await flushPromises()

    expect(sessionStore.sessions.length).toBe(1)
    expect(sessionStore.activeId).not.toBeNull()
  })

  it('mapStore mapData stays at default when no workspace', async () => {
    vi.mocked(loadWorkspace).mockReturnValue(null)
    const mapStore = useMapStore()

    mount(App)
    await flushPromises()

    expect(mapStore.mapData.bounds.radius).toBe(10)
    expect(mapStore.canUndo).toBe(false)
  })

  it('renders source-style tab strip and shortcuts corner chrome', async () => {
    vi.mocked(loadWorkspace).mockReturnValue(null)

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('[data-testid="tab-strip"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="shortcuts-corner"]').text()).toContain('Ctrl + Z')
    wrapper.unmount()
  })

  it('renders toast-container in the root', async () => {
    vi.mocked(loadWorkspace).mockReturnValue(null)

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('[data-testid="toast-container"]').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('App loadSavedCells on mount', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    stubIndexedDB()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('3.1 calls brushStore.loadSavedCells once on mount', async () => {
    vi.mocked(loadWorkspace).mockReturnValue(null)
    const brushStore = useBrushStore()
    const spy = vi.spyOn(brushStore, 'loadSavedCells')

    mount(App)
    await flushPromises()

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('App icon library init', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    stubIndexedDB()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('3.1 shows error toast and no console.error when icon library fails to load', async () => {
    vi.mocked(loadWorkspace).mockReturnValue(null)

    const iconLibraryStore = useIconLibraryStore()
    vi.spyOn(iconLibraryStore, 'loadIcons').mockRejectedValue(new Error('IndexedDB error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid^="toast-item"].toast-error').exists()).toBe(true)
    expect(consoleSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
