import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SwitchToggle from '../SwitchToggle.vue'

describe('SwitchToggle', () => {
  it('click 時 emit 反轉後的 modelValue', async () => {
    const wrapper = mount(SwitchToggle, {
      props: { modelValue: false },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('disabled 時不 emit 並套用不可互動樣式', async () => {
    const wrapper = mount(SwitchToggle, {
      props: { modelValue: false, disabled: true },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.attributes('style')).toContain('opacity: 0.4')
    expect(wrapper.attributes('style')).toContain('pointer-events: none')
  })

  it('渲染 label 與 default slot 圖示', () => {
    const wrapper = mount(SwitchToggle, {
      props: { modelValue: true, label: '格子' },
      slots: { default: '<span data-testid="icon">#</span>' },
    })

    expect(wrapper.find('.switch-label').text()).toBe('格子')
    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
  })

  it('modelValue=true 時 track 使用 is-on class', () => {
    const wrapper = mount(SwitchToggle, {
      props: { modelValue: true, label: '線條' },
    })

    expect(wrapper.find('.switch-track').classes()).toContain('is-on')
    expect(wrapper.find('.switch-track').classes()).not.toContain('is-off')
  })

  it('modelValue=false 時 track 使用 is-off class', () => {
    const wrapper = mount(SwitchToggle, {
      props: { modelValue: false, label: '線條' },
    })

    expect(wrapper.find('.switch-track').classes()).toContain('is-off')
    expect(wrapper.find('.switch-track').classes()).not.toContain('is-on')
  })

  it('渲染 track 與 thumb 元素供尺寸樣式套用', () => {
    const wrapper = mount(SwitchToggle, {
      props: { modelValue: false },
    })

    expect(wrapper.find('.switch-track').exists()).toBe(true)
    expect(wrapper.find('.switch-thumb').exists()).toBe(true)
  })
})
