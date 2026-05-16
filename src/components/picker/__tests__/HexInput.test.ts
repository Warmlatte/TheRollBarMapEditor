import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useColorPickerStore } from '../../../stores/colorPickerStore'
import HexInput from '../HexInput.vue'

describe('HexInput', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts without error', () => {
    const wrapper = mount(HexInput)
    expect(wrapper.exists()).toBe(true)
  })

  it('displays current hex from store', () => {
    const store = useColorPickerStore()
    store.setHsv(0, 1, 1)
    const wrapper = mount(HexInput)
    const input = wrapper.find('input')
    expect(input.element.value).toBe('#ff0000')
  })

  it('calls setHex on change with valid hex', async () => {
    const store = useColorPickerStore()
    store.setHsv(0, 0, 0)
    const wrapper = mount(HexInput)
    const input = wrapper.find('input')
    await input.setValue('#00ff00')
    await input.trigger('change')
    expect(store.hex).toBe('#00ff00')
  })

  it('does not update store on invalid input', async () => {
    const store = useColorPickerStore()
    store.setHsv(0, 0, 0)
    const wrapper = mount(HexInput)
    const input = wrapper.find('input')
    await input.setValue('#ff')
    await input.trigger('change')
    expect(store.hex).toBe('#000000')
  })
})
