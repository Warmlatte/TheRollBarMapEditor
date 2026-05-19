import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../../stores/brushStore'
import { useIconStore } from '../../../stores/iconStore'
import { useIconLibraryStore } from '../../../stores/iconLibraryStore'
import type { Pinia } from 'pinia'

vi.mock('../../../storage/svgNormalize', () => ({
  sanitizeSvgIcon: vi.fn((s: string) => s.replace(/<script[^>]*>.*?<\/script>/gs, '')),
  normalizeSvgIcon: vi.fn((s: string) => s),
}))

async function mountGhost(pinia: Pinia, props: Record<string, unknown> = {}) {
  const { default: IconGhost } = await import('../IconGhost.vue')
  return mount(IconGhost, {
    global: { plugins: [pinia] },
    props: { cursorX: 100, cursorY: 200, shiftHeld: false, ...props },
  })
}

describe('IconGhost uses brushStore.currentColor', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('uses brushStore.currentColor for fill and stroke', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    brushStore.setColor('#00aaff')
    iconStore.setSelectedSvgId('icon-1')
    libStore.icons = [{ id: 'icon-1', rawSvg: '<svg/>', name: 'Test', createdAt: 1000 }]
    const wrapper = await mountGhost(pinia)
    const rootG = wrapper.find('g')
    expect(rootG.attributes('fill')).toBe('#00aaff')
    expect(rootG.attributes('stroke')).toBe('#00aaff')
    wrapper.unmount()
  })

  it('is hidden when shiftHeld is true', async () => {
    const brushStore = useBrushStore()
    const iconStore = useIconStore()
    const libStore = useIconLibraryStore()
    brushStore.tool = 'icon'
    iconStore.setSelectedSvgId('icon-1')
    libStore.icons = [{ id: 'icon-1', rawSvg: '<svg/>', name: 'Test', createdAt: 1000 }]
    const wrapper = await mountGhost(pinia, { shiftHeld: true })
    expect(wrapper.find('g').exists()).toBe(false)
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })
})
