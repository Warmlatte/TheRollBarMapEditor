import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../../stores/brushStore'
import { useDoodleStore } from '../../../stores/doodleStore'
import type { Pinia } from 'pinia'

async function mountCursor(pinia: Pinia, props: Record<string, unknown> = {}) {
  const { default: DoodleCursor } = await import('../DoodleCursor.vue')
  return mount(DoodleCursor, {
    global: { plugins: [pinia] },
    props: { cursorX: 50, cursorY: 80, shiftHeld: false, ...props },
  })
}

describe('DoodleCursor displays a circle matching doodle width and opacity', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders circle with r = max(width/2, 4) using brush color and doodle opacity', async () => {
    const brushStore = useBrushStore()
    const doodleStore = useDoodleStore()
    brushStore.tool = 'doodle'
    brushStore.setColor('#ff0000')
    doodleStore.setWidth(10)
    doodleStore.setOpacity(0.7)
    const wrapper = await mountCursor(pinia)
    const circle = wrapper.find('circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('r')).toBe('5')
    expect(circle.attributes('fill')).toBe('#ff0000')
    expect(circle.attributes('fill-opacity')).toBe('0.7')
    expect(circle.attributes('stroke')).toBe('#fff')
    expect(circle.attributes('stroke-width')).toBe('1')
    wrapper.unmount()
  })

  it.each([
    [4, 4],
    [6, 4],
    [10, 5],
    [20, 10],
  ])('doodleStore.width=%i → r=%i (minimum 4 enforced)', async (width, expectedR) => {
    const brushStore = useBrushStore()
    const doodleStore = useDoodleStore()
    brushStore.tool = 'doodle'
    doodleStore.setWidth(width)
    const wrapper = await mountCursor(pinia)
    expect(wrapper.find('circle').attributes('r')).toBe(String(expectedR))
    wrapper.unmount()
  })

  it('is hidden when shift is held', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'doodle'
    const wrapper = await mountCursor(pinia, { shiftHeld: true })
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('is hidden when tool is not doodle', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia)
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })
})
