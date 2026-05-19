import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ColorPickerGrid from '../ColorPickerGrid.vue'

describe('ColorPickerGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts without error', () => {
    const wrapper = mount(ColorPickerGrid)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders SvSquare sub-component', () => {
    const wrapper = mount(ColorPickerGrid)
    expect(wrapper.find('.sv-square').exists()).toBe(true)
  })

  it('renders HuePicker sub-component', () => {
    const wrapper = mount(ColorPickerGrid)
    expect(wrapper.find('.hue-picker').exists()).toBe(true)
  })

  it('renders HexInput sub-component', () => {
    const wrapper = mount(ColorPickerGrid)
    expect(wrapper.find('.hex-input').exists()).toBe(true)
  })

  it('renders preview slot before the SV picker so the color picker stays on the right', () => {
    const wrapper = mount(ColorPickerGrid, {
      slots: {
        preview: '<div data-testid="preview-slot" />',
      },
    })
    const preview = wrapper.find('[data-testid="preview-slot"]').element
    const svSquare = wrapper.find('.sv-square').element

    expect(
      preview.compareDocumentPosition(svSquare) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
