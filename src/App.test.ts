import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import App from './App.vue'
import { useSessionStore } from './stores/sessionStore'
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

describe('App workspace restore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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
})
