import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import EraseToolHud from '../EraseToolHud.vue'
import { useEraseStore } from '../../stores/eraseStore'
import { useI18nStore } from '../../stores/i18nStore'

describe('EraseToolHud', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('使用 SwitchToggle 渲染四個 erase targets', () => {
    const wrapper = mount(EraseToolHud)

    expect(wrapper.findAll('.switch-toggle')).toHaveLength(4)
  })

  it('點擊 target toggle 時更新 eraseStore target', async () => {
    const eraseStore = useEraseStore()
    const wrapper = mount(EraseToolHud)

    await wrapper.findAll('.switch-toggle')[0].trigger('click')

    expect(eraseStore.targets.hex).toBe(false)
  })

  it('renders radius slider with 5 to 200 range', () => {
    const wrapper = mount(EraseToolHud)
    const slider = wrapper.find('input[type="range"]')

    expect(slider.attributes('min')).toBe('5')
    expect(slider.attributes('max')).toBe('200')
  })

  it('updates labels when locale changes', async () => {
    const i18nStore = useI18nStore()
    i18nStore.setLocale('zh-TW')
    const wrapper = mount(EraseToolHud)

    expect(wrapper.text()).toContain('半徑')
    expect(wrapper.text()).toContain('格子')

    i18nStore.setLocale('en')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Radius')
    expect(wrapper.text()).toContain('Hexes')
    expect(wrapper.text()).not.toContain('半徑')
  })

  it('renders All button and calls selectAllTargets on click', async () => {
    const eraseStore = useEraseStore()
    const i18nStore = useI18nStore()
    i18nStore.setLocale('zh-TW')
    const selectAllSpy = vi.spyOn(eraseStore, 'selectAllTargets')
    const wrapper = mount(EraseToolHud)

    const allButton = wrapper.findAll('button').find((button) => button.text() === '全部')
    expect(allButton).toBeTruthy()

    await allButton!.trigger('click')

    expect(selectAllSpy).toHaveBeenCalledTimes(1)
  })
})
