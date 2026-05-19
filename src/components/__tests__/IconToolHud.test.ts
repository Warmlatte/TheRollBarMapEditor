import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../stores/brushStore'
import { useColorPickerStore } from '../../stores/colorPickerStore'
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
const ICON_COLORED: IconEntry = {
  id: 'mountain',
  rawSvg: '<svg><path d="M0 0h10v10z"/></svg>',
  name: 'Mountain',
  createdAt: 1,
}

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
    expect(wrapper.find('[data-testid="icon-select-id-a"]').attributes('title')).toBe('Alpha')
    expect(wrapper.find('[data-testid="icon-select-id-b"]').attributes('title')).toBe('Beta')
    wrapper.unmount()
  })

  it('renders the original-style large preview and four-column icon picker', async () => {
    const libStore = useIconLibraryStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_A, ICON_B]
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="icon-large-preview"]').exists()).toBe(true)
    expect(wrapper.find('.icon-picker').exists()).toBe(true)
    expect(wrapper.findAll('.icon-cell').length).toBe(3)
    wrapper.unmount()
  })

  it('shows a save icon button and saved icons section below the default picker', async () => {
    const libStore = useIconLibraryStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_A]
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="icon-save-current"]').text()).toBe('儲存圖示')
    expect(wrapper.find('[data-testid="saved-icons-section"]').text()).toContain('已存圖示')
    expect(
      wrapper.find('.icon-picker').element.compareDocumentPosition(
        wrapper.find('[data-testid="saved-icons-section"]').element,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
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

  it('selected icon uses the active cell styling from the source app', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_A]
    iconStore.setSelectedSvgId('id-a')
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="icon-select-id-a"]').classes()).toContain('active')
    wrapper.unmount()
  })

  it('saving the current icon adds a colored entry to the saved icons section', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    const brushStore = useBrushStore()
    const colorPickerStore = useColorPickerStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_COLORED]
    iconStore.setSelectedSvgId('mountain')
    colorPickerStore.setHex('#336699')
    brushStore.setColor('#336699')
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-testid="icon-save-current"]').trigger('click')
    await wrapper.vm.$nextTick()

    const saved = wrapper.find('[data-testid="saved-icon-mountain-336699"]')
    expect(saved.exists()).toBe(true)
    expect(saved.attributes('style')).toContain('color: #336699')
    wrapper.unmount()
  })

  it('saving the same colored icon twice keeps a single saved preset button', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    const brushStore = useBrushStore()
    const colorPickerStore = useColorPickerStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_COLORED]
    iconStore.setSelectedSvgId('mountain')
    colorPickerStore.setHex('#336699')
    brushStore.setColor('#336699')
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-testid="icon-save-current"]').trigger('click')
    await wrapper.find('[data-testid="icon-save-current"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-testid="saved-icon-mountain-336699"]')).toHaveLength(1)
    expect(iconStore.savedIcons).toEqual([{ svgId: 'mountain', color: '#336699' }])
    wrapper.unmount()
  })

  it('disables saving and leaves saved icons unchanged when no icon is selected', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = []
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    const saveButton = wrapper.find('[data-testid="icon-save-current"]')
    expect(saveButton.attributes('disabled')).toBeDefined()
    await saveButton.trigger('click')

    expect(iconStore.savedIcons).toEqual([])
    wrapper.unmount()
  })

  it('clicking a saved icon restores its icon and color across stores', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    const brushStore = useBrushStore()
    const colorPickerStore = useColorPickerStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_COLORED]
    iconStore.setSelectedSvgId('mountain')
    iconStore.setColor('#336699')
    iconStore.saveCurrentIcon()
    iconStore.setSelectedSvgId(null)
    iconStore.setColor('#5b992e')
    brushStore.setColor('#5b992e')
    colorPickerStore.setHex('#5b992e')
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-testid="saved-icon-mountain-336699"]').trigger('click')

    expect(iconStore.selectedSvgId).toBe('mountain')
    expect(iconStore.color).toBe('#336699')
    expect(brushStore.color).toBe('#336699')
    expect(colorPickerStore.hex).toBe('#336699')
    wrapper.unmount()
  })

  it('does not render saved presets whose library icon is missing', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_A]
    iconStore.savedIcons = [{ svgId: 'missing', color: '#336699' }]
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="saved-icon-missing-336699"]').exists()).toBe(false)
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
