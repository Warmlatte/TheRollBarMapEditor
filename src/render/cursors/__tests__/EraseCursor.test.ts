import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../../stores/brushStore'
import { useEraseStore } from '../../../stores/eraseStore'
import { HEX_SIZE } from '../../../lib/hexMath'
import type { Pinia } from 'pinia'

async function mountCursor(pinia: Pinia, cursorX = 50, cursorY = 80) {
  const { default: EraseCursor } = await import('../EraseCursor.vue')
  return mount(EraseCursor, {
    global: { plugins: [pinia] },
    props: { cursorX, cursorY },
  })
}

describe('EraseCursor displays a red circle matching the erase radius', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders circle with r equal to eraseStore.radius (pixel value)', async () => {
    const brushStore = useBrushStore()
    const eraseStore = useEraseStore()
    brushStore.tool = 'erase'
    eraseStore.setRadius(1)
    const expectedR = String(1 * HEX_SIZE)
    const wrapper = await mountCursor(pinia)
    const circle = wrapper.find('circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('r')).toBe(expectedR)
    wrapper.unmount()
  })

  it('renders with fill rgba(255,60,60,0.18) and stroke #ff5050', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'erase'
    const wrapper = await mountCursor(pinia)
    const circle = wrapper.find('circle')
    expect(circle.attributes('fill')).toBe('rgba(255,60,60,0.18)')
    expect(circle.attributes('stroke')).toBe('#ff5050')
    wrapper.unmount()
  })

  it('has no stroke-dasharray', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'erase'
    const wrapper = await mountCursor(pinia)
    const circle = wrapper.find('circle')
    expect(circle.attributes('stroke-dasharray')).toBeUndefined()
    wrapper.unmount()
  })

  it('has no center dot circle', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'erase'
    const wrapper = await mountCursor(pinia)
    const circles = wrapper.findAll('circle')
    expect(circles).toHaveLength(1)
    wrapper.unmount()
  })

  it('is hidden when tool is not erase', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia)
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })

  it.each([
    [1, 1 * HEX_SIZE],
    [2, 2 * HEX_SIZE],
    [5, 5 * HEX_SIZE],
  ])('eraseRadius=%i produces r=%i', async (eraseRadius, expectedR) => {
    const brushStore = useBrushStore()
    const eraseStore = useEraseStore()
    brushStore.tool = 'erase'
    eraseStore.setRadius(eraseRadius)
    const wrapper = await mountCursor(pinia)
    expect(wrapper.find('circle').attributes('r')).toBe(String(expectedR))
    wrapper.unmount()
  })
})
