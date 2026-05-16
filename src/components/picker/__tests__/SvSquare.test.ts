import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SvSquare from '../SvSquare.vue'

describe('SvSquare', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts without error', () => {
    const wrapper = mount(SvSquare)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the sv-square container', () => {
    const wrapper = mount(SvSquare)
    expect(wrapper.find('.sv-square').exists()).toBe(true)
  })

  it('renders the cursor indicator', () => {
    const wrapper = mount(SvSquare)
    expect(wrapper.find('.sv-cursor').exists()).toBe(true)
  })
})
