import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HuePicker from '../HuePicker.vue'

describe('HuePicker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts without error', () => {
    const wrapper = mount(HuePicker)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the hue-picker container', () => {
    const wrapper = mount(HuePicker)
    expect(wrapper.find('.hue-picker').exists()).toBe(true)
  })

  it('renders the hue cursor', () => {
    const wrapper = mount(HuePicker)
    expect(wrapper.find('.hue-cursor').exists()).toBe(true)
  })
})
