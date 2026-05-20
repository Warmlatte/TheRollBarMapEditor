import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBrushStore } from '../../stores/brushStore'
import type { SavedCell } from '../../stores/brushStore'
import type { Pinia } from 'pinia'

vi.mock('../picker/ColorPickerGrid.vue', () => ({
  default: { template: '<div data-test="color-picker-grid" />' },
}))

async function mountHud(pinia: Pinia) {
  const { default: PaintToolHud } = await import('../PaintToolHud.vue')
  return mount(PaintToolHud, { global: { plugins: [pinia] } })
}

function makeSavedCell(id: string, color: string): SavedCell {
  return { id, color }
}

describe('PaintToolHud displays saved cells when any exist', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
  })

  it('saved-cells section is hidden when savedCells is empty', async () => {
    const wrapper = await mountHud(pinia)
    const section = wrapper.find('[data-testid="saved-cells-section"]')
    expect(section.exists()).toBe(false)
  })

  it('saved-cells section is visible when savedCells has one entry', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([{ id: 'c1', color: '#ff0000' }]),
    )
    brushStore.loadSavedCells()

    const wrapper = await mountHud(pinia)
    await flushPromises()

    expect(wrapper.find('[data-testid="saved-cells-section"]').exists()).toBe(true)
  })

  it('renders one thumbnail per saved cell', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([
        { id: 'c1', color: '#ff0000' },
        { id: 'c2', color: '#00ff00' },
      ]),
    )
    brushStore.loadSavedCells()

    const wrapper = await mountHud(pinia)
    await flushPromises()

    expect(wrapper.findAll('[data-testid="saved-cell-thumb"]')).toHaveLength(2)
  })

  it('thumbnail polygon is filled with the cell color', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([{ id: 'c1', color: '#123456' }]),
    )
    brushStore.loadSavedCells()

    const wrapper = await mountHud(pinia)
    await flushPromises()

    const poly = wrapper.find('[data-testid="saved-cell-thumb"] polygon')
    expect(poly.attributes('fill')).toBe('#123456')
  })
})

describe('clicking a saved cell thumbnail applies its color', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
  })

  it('clicking thumbnail calls applySavedCell with the cell id', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([{ id: 'cell-x', color: '#abcdef' }]),
    )
    brushStore.loadSavedCells()
    const applySpy = vi.spyOn(brushStore, 'applySavedCell')

    const wrapper = await mountHud(pinia)
    await flushPromises()

    await wrapper.find('[data-testid="saved-cell-thumb"]').trigger('click')
    expect(applySpy).toHaveBeenCalledWith('cell-x')
  })

  it('clicking thumbnail updates brushStore.color', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([{ id: 'cell-y', color: '#ff00ff' }]),
    )
    brushStore.loadSavedCells()

    const wrapper = await mountHud(pinia)
    await flushPromises()

    await wrapper.find('[data-testid="saved-cell-thumb"]').trigger('click')
    expect(brushStore.color).toBe('#ff00ff')
  })
})

describe('each saved cell thumbnail has a remove button', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
  })

  it('clicking × calls removeSavedCell with the cell id', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([{ id: 'del-1', color: '#aabbcc' }]),
    )
    brushStore.loadSavedCells()
    const removeSpy = vi.spyOn(brushStore, 'removeSavedCell')

    const wrapper = await mountHud(pinia)
    await flushPromises()

    await wrapper.find('[data-testid="saved-cell-remove"]').trigger('click')
    expect(removeSpy).toHaveBeenCalledWith('del-1')
  })

  it('clicking × does not trigger applySavedCell', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([{ id: 'del-2', color: '#112233' }]),
    )
    brushStore.loadSavedCells()
    const applySpy = vi.spyOn(brushStore, 'applySavedCell')

    const wrapper = await mountHud(pinia)
    await flushPromises()

    await wrapper.find('[data-testid="saved-cell-remove"]').trigger('click')
    expect(applySpy).not.toHaveBeenCalled()
  })

  it('clicking × removes the cell from the list', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem(
      'hexmap.savedCells.v1',
      JSON.stringify([{ id: 'rem-a', color: '#aaa' }]),
    )
    brushStore.loadSavedCells()
    const originalColor = brushStore.color

    const wrapper = await mountHud(pinia)
    await flushPromises()

    await wrapper.find('[data-testid="saved-cell-remove"]').trigger('click')
    expect(brushStore.savedCells.some((c) => c.id === 'rem-a')).toBe(false)
    expect(brushStore.color).toBe(originalColor)
  })
})

describe('PaintToolHud has a save button that stores the current color', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
  })

  it('clicking save button calls saveCurrentCell', async () => {
    const brushStore = useBrushStore()
    const saveSpy = vi.spyOn(brushStore, 'saveCurrentCell')

    const wrapper = await mountHud(pinia)
    await wrapper.find('[data-testid="save-cell-btn"]').trigger('click')
    expect(saveSpy).toHaveBeenCalledTimes(1)
  })

  it('clicking save button adds a new color', async () => {
    const brushStore = useBrushStore()
    // Start with empty saved cells
    localStorage.setItem('hexmap.savedCells.v1', '[]')
    brushStore.loadSavedCells()
    brushStore.setColor('#new111')

    const wrapper = await mountHud(pinia)
    await wrapper.find('[data-testid="save-cell-btn"]').trigger('click')
    expect(brushStore.savedCells.some((c) => c.color === '#new111')).toBe(true)
  })

  it('clicking save button twice does not duplicate', async () => {
    const brushStore = useBrushStore()
    localStorage.setItem('hexmap.savedCells.v1', '[]')
    brushStore.loadSavedCells()
    brushStore.setColor('#dup222')

    const wrapper = await mountHud(pinia)
    await wrapper.find('[data-testid="save-cell-btn"]').trigger('click')
    await wrapper.find('[data-testid="save-cell-btn"]').trigger('click')
    expect(brushStore.savedCells.filter((c) => c.color === '#dup222')).toHaveLength(1)
  })
})
