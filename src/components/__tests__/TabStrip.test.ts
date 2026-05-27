import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import TabStrip from '../TabStrip.vue'

const tabs = [
  { id: 'tab-a', name: 'A 地圖' },
  { id: 'tab-b', name: 'B 地圖' },
  { id: 'tab-c', name: 'C 地圖' },
]

describe('TabStrip', () => {
  it('點擊 tab emit update:activeId', async () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs },
    })

    await wrapper.findAll('.tab-btn')[1].trigger('click')

    expect(wrapper.emitted('update:activeId')).toEqual([['tab-b']])
  })

  it('+ 按鈕 emit add', async () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs },
    })

    await wrapper.find('.tab-add-btn').trigger('click')

    expect(wrapper.emitted('add')).toEqual([[]])
  })

  it('地圖按鈕 emit open-map-list', async () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs },
    })

    await wrapper.find('.map-list-btn').trigger('click')

    expect(wrapper.emitted('open-map-list')).toEqual([[]])
  })

  it('拖曳 drop emit reorder', async () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs },
    })
    const tabButtons = wrapper.findAll('.tab-btn')

    await tabButtons[0].trigger('dragstart')
    await tabButtons[2].trigger('dragover')
    await tabButtons[2].trigger('drop')

    expect(wrapper.emitted('reorder')).toEqual([[0, 2]])
  })

  it('雙擊 tab 名稱可編輯並在 Enter 送出 rename', async () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs },
    })
    const firstTab = wrapper.findAll('.tab-btn')[0]

    await firstTab.find('.tab-name').trigger('dblclick')
    const input = wrapper.get('[data-testid="tab-name-input"]')
    await input.setValue('新地圖名稱')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('rename')).toEqual([['tab-a', '新地圖名稱']])
  })

  it('logoSrc 空字串時不渲染 brand', () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs },
    })

    expect(wrapper.find('.tab-brand').exists()).toBe(false)
  })

  it('logoSrc 有值時渲染 brand 與分隔線', () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs, logoSrc: '/logo.png' },
    })

    expect(wrapper.find('.tab-brand').exists()).toBe(true)
    const mark = wrapper.find('.tab-brand-mark')
    expect(mark.exists()).toBe(true)
    expect(wrapper.find('.tab-brand img').exists()).toBe(false)
    expect(wrapper.find('.tab-sep').exists()).toBe(true)
  })

  it('brand mark 使用指定的奶油色遮罩', () => {
    const source = readFileSync(resolve(__dirname, '../TabStrip.vue'), 'utf-8')

    expect(source).toContain('background: #e8dcc4;')
  })

  it('active tab 有 is-active class 與 is-on indicator', () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-b', tabs },
    })
    const active = wrapper.findAll('.tab-btn')[1]

    expect(active.classes()).toContain('is-active')
    expect(active.find('.tab-indicator').classes()).toContain('is-on')
  })

  it('每個 tab 都有六角形 SVG icon', () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs },
    })

    expect(wrapper.findAll('.tab-hex-icon')).toHaveLength(tabs.length)
  })

  it('mapListOpen=true 時地圖按鈕有 is-active class', () => {
    const wrapper = mount(TabStrip, {
      props: { activeId: 'tab-a', tabs, mapListOpen: true },
    })

    expect(wrapper.find('.map-list-btn').classes()).toContain('is-active')
  })
})
