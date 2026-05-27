import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LoadHud from '../LoadHud.vue'
import { useSessionStore } from '../../stores/sessionStore'
import { getStorageAdapter } from '../../storage/adapter'
import type { MapData, MapFile } from '../../data/types'

vi.mock('../../storage/adapter', () => ({
  getStorageAdapter: vi.fn(),
}))

const firstMap: MapData = {
  name: '森林入口',
  bounds: { radius: 3 },
  hexes: [{ q: 0, r: 0, color: '#5b992e' }],
  icons: [],
  lines: [],
  doodles: [],
}

const secondMap: MapData = {
  name: '地下通道',
  bounds: { radius: 2 },
  hexes: [{ q: 1, r: -1, color: '#e5c66f' }],
  icons: [],
  lines: [],
  doodles: [],
}

const offsetMap: MapData = {
  name: '偏移地圖',
  bounds: { radius: 30 },
  hexes: [{ q: 18, r: -12, color: '#4a7a8a' }],
  icons: [],
  lines: [],
  doodles: [],
}

describe('LoadHud', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('顯示目前所有 session 地圖預覽並可切換 active map', async () => {
    const sessionStore = useSessionStore()
    const first = sessionStore.makeSession(firstMap)
    const second = sessionStore.makeSession(secondMap)
    sessionStore.setActive(first.id)

    const wrapper = mount(LoadHud)

    const cards = wrapper.findAll('[data-testid="map-preview-card"]')
    expect(cards).toHaveLength(2)
    expect(wrapper.text()).toContain('森林入口')
    expect(wrapper.text()).toContain('地下通道')
    expect(cards[0].classes()).toContain('is-active')

    await cards[1].trigger('click')

    expect(sessionStore.activeId).toBe(second.id)
  })

  it('使用全域 hud-panel 作為面板樣式保底', () => {
    const wrapper = mount(LoadHud)

    expect(wrapper.classes()).toContain('hud-panel')
    expect(wrapper.classes()).toContain('map-list-panel')
    expect(wrapper.classes()).toContain('absolute')
    expect(wrapper.attributes('style')).toContain('width: 420px')
    expect(wrapper.attributes('style')).toContain('padding: 0px')
  })

  it('拖曳地圖卡片可變換 session 順序', async () => {
    const sessionStore = useSessionStore()
    const first = sessionStore.makeSession(firstMap)
    const second = sessionStore.makeSession(secondMap)
    const third = sessionStore.makeSession(offsetMap)

    const wrapper = mount(LoadHud)
    const cards = wrapper.findAll('[data-testid="map-preview-card"]')

    expect(cards[0].attributes('draggable')).toBe('true')

    await cards[0].trigger('dragstart')
    await cards[2].trigger('dragover')
    await cards[2].trigger('drop')

    expect(sessionStore.sessions.map((session) => session.id)).toEqual([
      second.id,
      third.id,
      first.id,
    ])
  })

  it('預覽圖會把偏移座標置中在縮圖內', () => {
    const sessionStore = useSessionStore()
    sessionStore.makeSession(offsetMap)

    const wrapper = mount(LoadHud)
    const polygon = wrapper.get('[data-testid="map-preview-card"] polygon')
    const points = polygon.attributes('points').split(' ').flatMap((point) =>
      point.split(',').map((value) => Number(value)),
    )

    expect(Math.max(...points)).toBeLessThan(58)
    expect(Math.min(...points)).toBeGreaterThan(-58)
  })

  it('預覽圖呈現整張地圖 bounds，而不是只呈現已上色色塊', () => {
    const sessionStore = useSessionStore()
    sessionStore.makeSession(secondMap)

    const wrapper = mount(LoadHud)

    expect(wrapper.findAll('[data-testid="map-preview-card"] polygon')).toHaveLength(19)
  })

  it('底部有上傳檔案區塊，匯入 TRBM 後建立 session', async () => {
    const importedMap: MapFile = {
      version: 1,
      ...secondMap,
      name: '匯入地圖',
    }
    const handle = { name: 'imported.trbm' } as FileSystemFileHandle
    vi.mocked(getStorageAdapter).mockReturnValue({
      openMap: vi.fn(async () => ({ mapFile: importedMap, handle })),
      saveMap: vi.fn(),
      saveMapAs: vi.fn(),
      checkHandleExists: vi.fn(),
    })
    const sessionStore = useSessionStore()

    const wrapper = mount(LoadHud)
    await wrapper.get('[data-testid="map-upload-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('上傳檔案')
    expect(sessionStore.sessions).toHaveLength(1)
    expect(sessionStore.sessions[0].name).toBe('匯入地圖')
    expect(sessionStore.sessions[0].fileHandle).toEqual(handle)
  })
})
