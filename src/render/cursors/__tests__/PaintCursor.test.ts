import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../../stores/brushStore'
import type { Pinia } from 'pinia'

async function mountCursor(pinia: Pinia, props: Record<string, unknown> = {}) {
  const { default: PaintCursor } = await import('../PaintCursor.vue')
  return mount(PaintCursor, {
    global: { plugins: [pinia] },
    props: { cursorX: 50, cursorY: 80, shiftHeld: false, ...props },
  })
}

describe('PaintCursor displays a circle at cursor position', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {})

  it('renders circle r=6 with brush color when tool is paint and shift not held', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    brushStore.setColor('#ff0000')
    const wrapper = await mountCursor(pinia)
    const circle = wrapper.find('circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('r')).toBe('6')
    expect(circle.attributes('fill')).toBe('#ff0000')
    expect(circle.attributes('stroke')).toBe('#fff')
    expect(circle.attributes('stroke-width')).toBe('1')
    expect(circle.attributes('opacity')).toBe('0.85')
    expect(circle.attributes('pointer-events')).toBe('none')
    wrapper.unmount()
  })

  it('is positioned at (cursorX, cursorY)', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia, { cursorX: 120, cursorY: 200 })
    const g = wrapper.find('g')
    expect(g.attributes('transform')).toContain('translate(120, 200)')
    wrapper.unmount()
  })

  it('is hidden when shift is held', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia, { shiftHeld: true })
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('is hidden when tool is not paint', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'erase'
    const wrapper = await mountCursor(pinia)
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })
})
