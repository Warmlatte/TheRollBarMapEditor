import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('BrandBar', () => {
  it('renders the brand mark and product labels with the required layout classes', async () => {
    const { default: BrandBar } = await import('../BrandBar.vue')
    const wrapper = mount(BrandBar)

    const root = wrapper.get('div')
    expect(root.classes()).toEqual(
      expect.arrayContaining([
        'absolute',
        'top-[10px]',
        'left-3',
        'z-[12]',
        'flex',
        'items-center',
        'gap-2.5',
        'py-1.5',
        'pr-3.5',
        'pl-2',
        'bg-black/65',
        'backdrop-blur-sm',
        'rounded-md',
        'select-none',
        'pointer-events-none',
      ]),
    )

    const image = wrapper.get('img')
    expect(image.attributes('src')).toBe('/src/assets/the-roll-bar-mark-light.png')
    expect(image.attributes('alt')).toBe('The Roll Bar')
    expect(image.classes()).toEqual(expect.arrayContaining(['h-9', 'w-auto', 'block']))

    expect(wrapper.text()).toContain('THE ROLL BAR')
    expect(wrapper.text()).toContain('地圖編輯器')
    expect(wrapper.get('span:first-child').classes()).toEqual(
      expect.arrayContaining([
        'text-[9px]',
        'font-medium',
        'leading-none',
        'text-[#e8dcc4]',
        'tracking-[0.18em]',
        'font-sans',
      ]),
    )
    expect(wrapper.get('span:last-child').classes()).toEqual(
      expect.arrayContaining(['text-sm', 'font-semibold', 'leading-none', 'text-[#ddd]', 'font-sans']),
    )

    wrapper.unmount()
  })

  it('uses only template Tailwind classes without a style block', () => {
    const source = readFileSync(resolve(__dirname, '../BrandBar.vue'), 'utf-8')
    expect(source).not.toContain('<style')
  })
})
