import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../stores/brushStore'
import { useColorPickerStore } from '../../stores/colorPickerStore'
import { useIconStore } from '../../stores/iconStore'
import { useIconLibraryStore } from '../../stores/iconLibraryStore'
import type { IconEntry } from '../../stores/iconLibraryStore'
import { useToastStore } from '../../stores/toastStore'
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
const DEFAULT_ICON_ENTRIES: IconEntry[] = [
  { id: 'mountain', rawSvg: '<svg><path d="M0 0h10v10z"/></svg>', name: 'Mountain', createdAt: 1 },
  { id: 'tree', rawSvg: '<svg><path d="M0 0h10v10z"/></svg>', name: 'Tree', createdAt: 2 },
  { id: 'tower', rawSvg: '<svg><path d="M0 0h10v10z"/></svg>', name: 'Tower', createdAt: 3 },
  { id: 'skull', rawSvg: '<svg><path d="M0 0h10v10z"/></svg>', name: 'Skull', createdAt: 4 },
]

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

  it('renders every default library icon in gray', async () => {
    const libStore = useIconLibraryStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = DEFAULT_ICON_ENTRIES
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    for (const entry of DEFAULT_ICON_ENTRIES) {
      expect(wrapper.find(`[data-testid="icon-select-${entry.id}"]`).attributes('style')).toContain('color: #7a7a7a')
    }
    wrapper.unmount()
  })

  it('renders built-in saved icons with preset colors', async () => {
    const libStore = useIconLibraryStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = DEFAULT_ICON_ENTRIES
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="saved-icon-mountain-7a7a7a"]').attributes('style')).toContain('color: #7a7a7a')
    expect(wrapper.find('[data-testid="saved-icon-tree-4a7a3a"]').attributes('style')).toContain('color: #4a7a3a')
    expect(wrapper.find('[data-testid="saved-icon-tower-7a4a2a"]').attributes('style')).toContain('color: #7a4a2a')
    expect(wrapper.find('[data-testid="saved-icon-skull-c33232"]').attributes('style')).toContain('color: #c33232')
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
    expect(iconStore.savedIcons.filter((icon) => icon.svgId === 'mountain' && icon.color === '#336699')).toHaveLength(1)
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

    expect(iconStore.savedIcons).toEqual([
      { id: 'mountain-default', svgId: 'mountain', color: '#7a7a7a', size: 65, rotation: 0 },
      { id: 'tree-default', svgId: 'tree', color: '#4a7a3a', size: 65, rotation: 0 },
      { id: 'tower-default', svgId: 'tower', color: '#7a4a2a', size: 65, rotation: 0 },
      { id: 'skull-default', svgId: 'skull', color: '#c33232', size: 65, rotation: 0 },
    ])
    wrapper.unmount()
  })

  it('clicking a saved icon restores its icon, color, size and rotation across stores', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    const brushStore = useBrushStore()
    const colorPickerStore = useColorPickerStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_COLORED]
    iconStore.setSelectedSvgId('mountain')
    iconStore.setColor('#336699')
    iconStore.setSize(125)
    iconStore.setRotation(45)
    iconStore.saveCurrentIcon()
    iconStore.setSelectedSvgId(null)
    iconStore.setColor('#5b992e')
    iconStore.setSize(65)
    iconStore.setRotation(0)
    brushStore.setColor('#5b992e')
    colorPickerStore.setHex('#5b992e')
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-testid="saved-icon-mountain-336699"]').trigger('click')

    expect(iconStore.selectedSvgId).toBe('mountain')
    expect(iconStore.color).toBe('#336699')
    expect(iconStore.size).toBe(125)
    expect(iconStore.rotation).toBe(45)
    expect(brushStore.color).toBe('#336699')
    expect(colorPickerStore.hex).toBe('#336699')
    wrapper.unmount()
  })

  it('clicking a saved icon remove button deletes the preset', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_COLORED]
    iconStore.setSelectedSvgId('mountain')
    iconStore.setColor('#336699')
    iconStore.saveCurrentIcon()
    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-testid="saved-icon-remove-mountain-336699-65-0"]').trigger('click')

    expect(iconStore.savedIcons.some((icon) => icon.id === 'mountain-336699-65-0')).toBe(false)
    wrapper.unmount()
  })

  it('does not render saved presets whose library icon is missing', async () => {
    const libStore = useIconLibraryStore()
    const iconStore = useIconStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    libStore.icons = [ICON_A]
    iconStore.savedIcons = [{ id: 'missing-336699-65-0', svgId: 'missing', color: '#336699', size: 65, rotation: 0 }]
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

  it('2.1 shows info toast with "圖示已刪除" when delete succeeds', async () => {
    const libStore = useIconLibraryStore()
    const toastStore = useToastStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    vi.spyOn(libStore, 'deleteIcon').mockResolvedValue()
    const pushSpy = vi.spyOn(toastStore, 'pushToast')
    libStore.icons = [ICON_A]

    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-testid="icon-delete-id-a"]').trigger('click')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith('圖示已刪除', 'info')
    wrapper.unmount()
  })

  it('2.2 shows error toast when delete fails', async () => {
    const libStore = useIconLibraryStore()
    const toastStore = useToastStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    vi.spyOn(libStore, 'deleteIcon').mockRejectedValue(new Error('db not initialized'))
    const pushSpy = vi.spyOn(toastStore, 'pushToast')
    libStore.icons = [ICON_A]

    const wrapper = await mountHud(pinia)
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-testid="icon-delete-id-a"]').trigger('click')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith(expect.any(String), 'error')
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

  it('1.1 shows error toast when addIcon throws validation error', async () => {
    const libStore = useIconLibraryStore()
    const toastStore = useToastStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    vi.spyOn(libStore, 'addIcon').mockRejectedValue(new Error('Invalid SVG: sanitization produced empty output'))
    const pushSpy = vi.spyOn(toastStore, 'pushToast')

    const svgContent = '<svg><rect/></svg>'
    const mockFile = new File([svgContent], 'bad-icon.svg', { type: 'image/svg+xml' })

    vi.stubGlobal('FileReader', vi.fn(() => ({
      readAsText: vi.fn(function (this: { onload?: (e: { target: { result: string } }) => void }) {
        this.onload?.({ target: { result: svgContent } })
      }),
      onload: null,
      onerror: null,
    })))

    const wrapper = await mountHud(pinia)
    const input = wrapper.find('[data-testid="icon-upload"]')
    Object.defineProperty(input.element, 'files', { value: [mockFile], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith(expect.any(String), 'error')
    wrapper.unmount()
  })

  it('1.2 shows success toast containing icon name when upload succeeds', async () => {
    const libStore = useIconLibraryStore()
    const toastStore = useToastStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    vi.spyOn(libStore, 'addIcon').mockResolvedValue()
    const pushSpy = vi.spyOn(toastStore, 'pushToast')

    const svgContent = '<svg><rect/></svg>'
    const mockFile = new File([svgContent], 'dragon.svg', { type: 'image/svg+xml' })

    vi.stubGlobal('FileReader', vi.fn(() => ({
      readAsText: vi.fn(function (this: { onload?: (e: { target: { result: string } }) => void }) {
        this.onload?.({ target: { result: svgContent } })
      }),
      onload: null,
      onerror: null,
    })))

    const wrapper = await mountHud(pinia)
    const input = wrapper.find('[data-testid="icon-upload"]')
    Object.defineProperty(input.element, 'files', { value: [mockFile], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith(expect.stringContaining('dragon'), 'success')
    wrapper.unmount()
  })

  it('1.3 shows error toast when FileReader fails', async () => {
    const libStore = useIconLibraryStore()
    const toastStore = useToastStore()
    vi.spyOn(libStore, 'loadIcons').mockResolvedValue()
    const pushSpy = vi.spyOn(toastStore, 'pushToast')

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
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith(expect.any(String), 'error')
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
