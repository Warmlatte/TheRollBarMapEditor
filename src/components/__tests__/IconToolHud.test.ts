import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useIconStore } from '../../stores/iconStore'
import { useIconLibraryStore } from '../../stores/iconLibraryStore'
import type { IconEntry } from '../../stores/iconLibraryStore'
import type { Pinia } from 'pinia'

vi.mock('../../storage/svgNormalize', () => ({
  sanitizeSvgIcon: vi.fn((s: string) => s),
  normalizeSvgIcon: vi.fn((s: string) => s),
}))

const ICON_A: IconEntry = { id: 'id-a', rawSvg: '<svg/>', name: 'Alpha', createdAt: 1000 }
const ICON_B: IconEntry = { id: 'id-b', rawSvg: '<svg/>', name: 'Beta', createdAt: 2000 }

async function mountHud(pinia: Pinia) {
  const { default: IconToolHud } = await import('../IconToolHud.vue')
  return mount(IconToolHud, { global: { plugins: [pinia] } })
}

describe('IconToolHud — library loading', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('calls loadIcons() on mount', async () => {
    const libStore = useIconLibraryStore()
    const loadSpy = vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    await mountHud(pinia)
    expect(loadSpy).toHaveBeenCalledTimes(1)
  })

  it('renders an entry for each icon in the library', async () => {
    const libStore = useIconLibraryStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_A, ICON_B]
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Beta')
    wrapper.unmount()
  })
})

describe('IconToolHud — icon selection', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('clicking an icon sets selectedSvgId to that icon id', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_A]
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('[data-testid="icon-select-id-a"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(iconStore.selectedSvgId).toBe('id-a')
    wrapper.unmount()
  })
})

describe('IconToolHud — icon deletion', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('deleting selected icon clears selectedSvgId', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    const deleteSpy = vi.spyOn(libStore, 'deleteIcon').mockResolvedValue()
    libStore.icons = [ICON_A]
    iconStore.setSelectedSvgId('id-a')
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    const deleteBtn = wrapper.find('[data-testid="icon-delete-id-a"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')
    expect(deleteSpy).toHaveBeenCalledWith('id-a')
    expect(iconStore.selectedSvgId).toBeNull()
    wrapper.unmount()
  })

  it('deleting non-selected icon does not clear selectedSvgId', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    vi.spyOn(libStore, 'deleteIcon').mockResolvedValue()
    libStore.icons = [ICON_A, ICON_B]
    iconStore.setSelectedSvgId('id-b')
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    const deleteBtn = wrapper.find('[data-testid="icon-delete-id-a"]')
    await deleteBtn.trigger('click')
    expect(iconStore.selectedSvgId).toBe('id-b')
    wrapper.unmount()
  })
})

describe('IconToolHud — SVG upload', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uploading a .svg file calls addIcon with content and filename without extension', async () => {
    const libStore = useIconLibraryStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    const addSpy = vi.spyOn(libStore, 'addIcon').mockResolvedValue()
    const svgContent = '<svg><rect/></svg>'
    const mockFile = new File([svgContent], 'my-icon.svg', { type: 'image/svg+xml' })

    vi.stubGlobal('FileReader', vi.fn(() => ({
      readAsText: vi.fn(function (this: { onload?: (e: { target: { result: string } }) => void }) {
        this.onload?.({ target: { result: svgContent } })
      }),
      onload: null,
      onerror: null,
    })))

    const wrapper = await mountHud(pinia)
    const input = wrapper.find('[data-testid="icon-upload"]')
    expect(input.exists()).toBe(true)
    Object.defineProperty(input.element, 'files', { value: [mockFile], configurable: true })
    await input.trigger('change')
    await wrapper.vm.$nextTick()

    expect(addSpy).toHaveBeenCalledWith(svgContent, 'my-icon')
    wrapper.unmount()
  })

  it('uploading a non-SVG file does not call addIcon', async () => {
    const libStore = useIconLibraryStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    const addSpy = vi.spyOn(libStore, 'addIcon').mockResolvedValue()
    const mockFile = new File(['data'], 'photo.png', { type: 'image/png' })

    const wrapper = await mountHud(pinia)
    const input = wrapper.find('[data-testid="icon-upload"]')
    Object.defineProperty(input.element, 'files', { value: [mockFile], configurable: true })
    await input.trigger('change')

    expect(addSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('FileReader error does not add icon or change selection state', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    const addSpy = vi.spyOn(libStore, 'addIcon').mockResolvedValue()
    iconStore.setSelectedSvgId('existing-id')

    const mockFile = new File(['<svg/>'], 'fail.svg', { type: 'image/svg+xml' })
    vi.stubGlobal('FileReader', vi.fn(() => ({
      readAsText: vi.fn(function (this: { onerror?: () => void }) {
        this.onerror?.()
      }),
      onload: null,
      onerror: null,
    })))

    const wrapper = await mountHud(pinia)
    const input = wrapper.find('[data-testid="icon-upload"]')
    Object.defineProperty(input.element, 'files', { value: [mockFile], configurable: true })
    await input.trigger('change')

    expect(addSpy).not.toHaveBeenCalled()
    expect(iconStore.selectedSvgId).toBe('existing-id')
    wrapper.unmount()
  })
})
