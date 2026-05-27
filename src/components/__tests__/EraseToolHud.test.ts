import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import EraseToolHud from '../EraseToolHud.vue'
import { useEraseStore } from '../../stores/eraseStore'

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
})
