import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useLineStore } from '../../stores/lineStore'
import type { Pinia } from 'pinia'

vi.mock('../picker/ColorPickerGrid.vue', () => ({
  default: { template: '<div data-test="color-picker-grid" />' },
}))

async function mountHud(pinia: Pinia) {
  const { default: LineToolHud } = await import('../LineToolHud.vue')
  return mount(LineToolHud, { global: { plugins: [pinia] } })
}

describe('LineToolHud — pending anchor hint', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
  })

  it('shows hint text when pendingAnchor is set', async () => {
    const lineStore = useLineStore()
    lineStore.pendingAnchor = { x: 10, y: 20 }
    const wrapper = await mountHud(pinia)
    expect(wrapper.text()).toContain('起點已放置')
  })

  it('hides hint when pendingAnchor is null', async () => {
    const lineStore = useLineStore()
    lineStore.pendingAnchor = null
    const wrapper = await mountHud(pinia)
    expect(wrapper.text()).not.toContain('起點已放置')
  })
})
