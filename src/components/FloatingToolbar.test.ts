import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useBrushStore } from '../stores/brushStore'
import { TOOLS } from '../tools/registry'
import FloatingToolbar from './FloatingToolbar.vue'

describe('FloatingToolbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('以 v-for 渲染 TOOLS.length 個按鈕', () => {
    const wrapper = mount(FloatingToolbar)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(TOOLS.length)
  })

  it('原始碼不含任何工具 id 字串', () => {
    const src = readFileSync(FloatingToolbar.__file as string, 'utf-8')
    const toolIds = ['paint', 'icon', 'line', 'doodle', 'erase']
    for (const id of toolIds) {
      expect(src).not.toContain(`'${id}'`)
      expect(src).not.toContain(`"${id}"`)
    }
  })

  it('erase 按鈕含 .btn-danger class（variant 欄位控制）', () => {
    const wrapper = mount(FloatingToolbar)
    const eraseIndex = TOOLS.findIndex(t => t.id === 'erase')
    const buttons = wrapper.findAll('button')
    expect(buttons[eraseIndex].classes()).toContain('btn-danger')
  })

  it('brushStore.tool === "line" 時，line 按鈕含 .active class', async () => {
    const store = useBrushStore()
    store.setTool('line')
    const wrapper = mount(FloatingToolbar)
    const lineIndex = TOOLS.findIndex(t => t.id === 'line')
    const buttons = wrapper.findAll('button')
    expect(buttons[lineIndex].classes()).toContain('active')
  })

  it('非 active 工具按鈕不含 .active class', async () => {
    const store = useBrushStore()
    store.setTool('line')
    const wrapper = mount(FloatingToolbar)
    const buttons = wrapper.findAll('button')
    for (let i = 0; i < TOOLS.length; i++) {
      if (TOOLS[i].id !== 'line') {
        expect(buttons[i].classes()).not.toContain('active')
      }
    }
  })

  it('點擊按鈕呼叫 brushStore.setTool', async () => {
    const store = useBrushStore()
    const wrapper = mount(FloatingToolbar)
    const paintIndex = TOOLS.findIndex(t => t.id === 'paint')
    await wrapper.findAll('button')[paintIndex].trigger('click')
    expect(store.tool).toBe('paint')
  })

  it('active 工具按鈕有 aria-pressed="true"，其餘為 false', async () => {
    const store = useBrushStore()
    store.setTool('line')
    const wrapper = mount(FloatingToolbar)
    const buttons = wrapper.findAll('button')
    for (let i = 0; i < TOOLS.length; i++) {
      const expected = TOOLS[i].id === 'line' ? 'true' : 'false'
      expect(buttons[i].attributes('aria-pressed')).toBe(expected)
    }
  })
})
