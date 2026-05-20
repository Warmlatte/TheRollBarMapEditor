import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../../stores/brushStore'
import type { Pinia } from 'pinia'

async function mountCursor(pinia: Pinia, props: Record<string, unknown> = {}) {
  const { default: ShiftErasePreview } = await import('../ShiftErasePreview.vue')
  return mount(ShiftErasePreview, {
    global: { plugins: [pinia] },
    props: {
      cursorX: 100,
      cursorY: 200,
      shiftHeld: false,
      anyDragging: false,
      ...props,
    },
  })
}

describe('ShiftErasePreview shows a fixed-radius red indicator during shift-drag erase', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders circle r=5 with red fill and stroke when shiftHeld && anyDragging && tool is paint', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia, { shiftHeld: true, anyDragging: true })
    const circle = wrapper.find('circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('r')).toBe('5')
    expect(circle.attributes('fill')).toBe('rgba(255,60,60,0.18)')
    expect(circle.attributes('stroke')).toBe('#ff5050')
    expect(circle.attributes('stroke-width')).toBe('1.5')
    expect(circle.attributes('pointer-events')).toBe('none')
    wrapper.unmount()
  })

  it('is hidden when anyDragging is false', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia, { shiftHeld: true, anyDragging: false })
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('is hidden when shiftHeld is false', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia, { shiftHeld: false, anyDragging: true })
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('is hidden when tool is erase', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'erase'
    const wrapper = await mountCursor(pinia, { shiftHeld: true, anyDragging: true })
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('is positioned at (cursorX, cursorY)', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'doodle'
    const wrapper = await mountCursor(pinia, {
      cursorX: 120,
      cursorY: 300,
      shiftHeld: true,
      anyDragging: true,
    })
    const circle = wrapper.find('circle')
    expect(circle.attributes('cx')).toBe('120')
    expect(circle.attributes('cy')).toBe('300')
    wrapper.unmount()
  })

  it('radius is always 5 regardless of tool or conditions', async () => {
    const brushStore = useBrushStore()
    for (const tool of ['paint', 'doodle', 'line', 'icon'] as const) {
      brushStore.tool = tool
      const wrapper = await mountCursor(pinia, { shiftHeld: true, anyDragging: true })
      expect(wrapper.find('circle').attributes('r')).toBe('5')
      wrapper.unmount()
    }
  })
})
