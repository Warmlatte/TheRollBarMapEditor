import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useIconStore } from '../../../stores/iconStore'
import { useIconLibraryStore } from '../../../stores/iconLibraryStore'
import { useBrushStore } from '../../../stores/brushStore'
import type { Pinia } from 'pinia'

vi.mock('../../../storage/svgNormalize', () => ({
  sanitizeSvgIcon: vi.fn((s: string) => s.replace(/<script[^>]*>.*?<\/script>/gs, '')),
  normalizeSvgIcon: vi.fn((s: string) => s),
}))

async function mountGhost(pinia: Pinia, cursorX = 100, cursorY = 200) {
  const { default: IconGhost } = await import('../IconGhost.vue')
  return mount(IconGhost, {
    global: { plugins: [pinia] },
    props: { cursorX, cursorY },
  })
}

describe('IconGhost — hidden when tool is not icon', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when tool is paint (not icon)', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountGhost(pinia)
    expect(wrapper.find('g').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('IconGhost — placeholder when no icon selected', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows placeholder crosshair when icon tool active but no selectedSvgId', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    brushStore.tool = 'icon'
    iconStore.setSelectedSvgId(null)
    const wrapper = await mountGhost(pinia)
    expect(wrapper.find('line').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows placeholder when selectedSvgId cannot be resolved in library', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    iconStore.setSelectedSvgId('nonexistent-id')
    libStore.icons = []
    const wrapper = await mountGhost(pinia)
    expect(wrapper.find('line').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('IconGhost — displays safe SVG when icon selected', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders display-safe SVG (not raw) when selectedSvgId resolves to library entry', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    iconStore.setSelectedSvgId('icon-1')
    libStore.icons = [{ id: 'icon-1', rawSvg: '<svg><circle r="5"/></svg>', name: 'Dot', createdAt: 1000 }]
    const wrapper = await mountGhost(pinia)
    const html = wrapper.html()
    expect(html).toContain('circle')
    wrapper.unmount()
  })

  it('does not inject raw SVG with script tags into the DOM', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    iconStore.setSelectedSvgId('icon-bad')
    libStore.icons = [{ id: 'icon-bad', rawSvg: '<svg><script>alert(1)</script></svg>', name: 'Bad', createdAt: 1000 }]
    const wrapper = await mountGhost(pinia)
    expect(wrapper.html()).not.toContain('<script>')
    wrapper.unmount()
  })

  it('applies opacity 0.45 for ghost effect', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    iconStore.setSelectedSvgId('icon-1')
    libStore.icons = [{ id: 'icon-1', rawSvg: '<svg/>', name: 'Test', createdAt: 1000 }]
    const wrapper = await mountGhost(pinia)
    const rootG = wrapper.find('g')
    expect(rootG.attributes('opacity')).toBe('0.45')
    wrapper.unmount()
  })

  it('applies transform with cursorX, cursorY, size and rotation from iconStore', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    iconStore.setSelectedSvgId('icon-1')
    iconStore.setSize(60)
    iconStore.setRotation(45)
    libStore.icons = [{ id: 'icon-1', rawSvg: '<svg/>', name: 'Test', createdAt: 1000 }]
    const wrapper = await mountGhost(pinia, 150, 250)
    const rootG = wrapper.find('g')
    const transform = rootG.attributes('transform') ?? ''
    expect(transform).toContain('translate(150, 250)')
    expect(transform).toContain('scale(0.6)')
    expect(transform).toContain('45')
    expect(transform).toContain('translate(-50,-50)')
    wrapper.unmount()
  })

  it('inherits icon color through fill and stroke like placed SVG icons', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    iconStore.setColor('#336699')
    iconStore.setSelectedSvgId('icon-1')
    libStore.icons = [{ id: 'icon-1', rawSvg: '<svg/>', name: 'Test', createdAt: 1000 }]
    const wrapper = await mountGhost(pinia)
    const rootG = wrapper.find('g')
    expect(rootG.attributes('fill')).toBe('#336699')
    expect(rootG.attributes('stroke')).toBe('#336699')
    wrapper.unmount()
  })
})
