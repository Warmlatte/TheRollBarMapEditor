import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../../stores/brushStore'
import { useLineStore } from '../../../stores/lineStore'
import type { Pinia } from 'pinia'

async function mountCursor(pinia: Pinia, props: Record<string, unknown> = {}) {
  const { default: LineCursorAndPreview } = await import('../LineCursorAndPreview.vue')
  return mount(LineCursorAndPreview, {
    global: { plugins: [pinia] },
    props: { cursorX: 100, cursorY: 200, shiftHeld: false, ...props },
  })
}

describe('LineCursorAndPreview displays cursor and anchor preview using brush color', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders cursor circle with r=max(lineWidth/2+1, 4) using brush color', async () => {
    const brushStore = useBrushStore()
    const lineStore = useLineStore()
    brushStore.tool = 'line'
    brushStore.setColor('#aa00ff')
    lineStore.setWidth(4)
    const wrapper = await mountCursor(pinia)
    // lineWidth=4 → max(4/2+1=3, 4) = 4
    const circle = wrapper.find('circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('r')).toBe('4')
    expect(circle.attributes('fill')).toBe('#aa00ff')
    expect(circle.attributes('stroke')).toBe('#fff')
    expect(circle.attributes('stroke-width')).toBe('1')
    expect(circle.attributes('opacity')).toBe('0.85')
    wrapper.unmount()
  })

  it('renders cursor circle r=5 when lineWidth=8', async () => {
    const brushStore = useBrushStore()
    const lineStore = useLineStore()
    brushStore.tool = 'line'
    lineStore.setWidth(8)
    const wrapper = await mountCursor(pinia)
    // lineWidth=8 → max(8/2+1=5, 4) = 5
    const circle = wrapper.find('circle')
    expect(circle.attributes('r')).toBe('5')
    wrapper.unmount()
  })

  it('renders no cross-line elements', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'line'
    const wrapper = await mountCursor(pinia)
    const lines = wrapper.findAll('line')
    expect(lines).toHaveLength(0)
    wrapper.unmount()
  })

  it('renders preview line without dasharray when dashed=false', async () => {
    const brushStore = useBrushStore()
    const lineStore = useLineStore()
    brushStore.tool = 'line'
    brushStore.setColor('#aa00ff')
    lineStore.setDashed(false)
    lineStore.pendingAnchor = { x: 0, y: 0 }
    lineStore.previewEnd = { x: 50, y: 50 }
    const wrapper = await mountCursor(pinia)
    const previewLine = wrapper.find('line')
    expect(previewLine.exists()).toBe(true)
    expect(previewLine.attributes('stroke')).toBe('#aa00ff')
    expect(previewLine.attributes('stroke-dasharray')).toBeUndefined()
    expect(previewLine.attributes('opacity')).toBe('0.5')
    wrapper.unmount()
  })

  it('renders preview line with dasharray when dashed=true', async () => {
    const brushStore = useBrushStore()
    const lineStore = useLineStore()
    brushStore.tool = 'line'
    lineStore.setDashed(true)
    lineStore.pendingAnchor = { x: 0, y: 0 }
    lineStore.previewEnd = { x: 50, y: 50 }
    const wrapper = await mountCursor(pinia)
    const previewLine = wrapper.find('line')
    expect(previewLine.attributes('stroke-dasharray')).toBe(
      `${lineStore.dashLength} ${lineStore.dashGap}`,
    )
    wrapper.unmount()
  })

  it('renders anchor circle with r=max(lineWidth/2+1, 3) using brush color', async () => {
    const brushStore = useBrushStore()
    const lineStore = useLineStore()
    brushStore.tool = 'line'
    brushStore.setColor('#aa00ff')
    lineStore.setWidth(4)
    lineStore.pendingAnchor = { x: 10, y: 20 }
    lineStore.previewEnd = { x: 50, y: 50 }
    const wrapper = await mountCursor(pinia)
    // anchor circle is the first circle (at anchor position)
    const circles = wrapper.findAll('circle')
    // First circle: anchor; second: cursor
    const anchorCircle = circles[0]
    // lineWidth=4 → max(4/2+1=3, 3) = 3
    expect(anchorCircle.attributes('r')).toBe('3')
    expect(anchorCircle.attributes('fill')).toBe('#aa00ff')
    wrapper.unmount()
  })

  it('is hidden when shift is held', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'line'
    const wrapper = await mountCursor(pinia, { shiftHeld: true })
    expect(wrapper.find('circle').exists()).toBe(false)
    expect(wrapper.find('line').exists()).toBe(false)
    wrapper.unmount()
  })

  it('is hidden when tool is not line', async () => {
    const brushStore = useBrushStore()
    brushStore.tool = 'paint'
    const wrapper = await mountCursor(pinia)
    expect(wrapper.find('circle').exists()).toBe(false)
    wrapper.unmount()
  })
})
