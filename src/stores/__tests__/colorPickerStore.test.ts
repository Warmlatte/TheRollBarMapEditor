import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useColorPickerStore } from '../colorPickerStore'

describe('colorPickerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hex is computed from initial h/s/v', () => {
    const store = useColorPickerStore()
    expect(store.hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  describe('setHsv', () => {
    it.each([
      [0, 0, 0, '#000000'],
      [0, 0, 1, '#ffffff'],
      [0, 1, 1, '#ff0000'],
      [120, 1, 1, '#00ff00'],
      [240, 1, 1, '#0000ff'],
    ])('setHsv(%i, %i, %i) => hex = %s', (h, s, v, expected) => {
      const store = useColorPickerStore()
      store.setHsv(h, s, v)
      expect(store.hex).toBe(expected)
    })
  })

  describe('setHex', () => {
    it('valid hex updates h/s/v', () => {
      const store = useColorPickerStore()
      store.setHsv(0, 0, 0)
      store.setHex('#ff0000')
      expect(store.hex).toBe('#ff0000')
    })

    it('case-insensitive: #FF0000 is accepted', () => {
      const store = useColorPickerStore()
      store.setHsv(0, 0, 0)
      store.setHex('#FF0000')
      expect(store.hex).toBe('#ff0000')
    })

    it.each(['#ff', '#gg0000', 'ff0000', '', '#12345'])('invalid input "%s" is silently ignored', (bad) => {
      const store = useColorPickerStore()
      store.setHsv(0, 0, 0)
      store.setHex(bad)
      expect(store.hex).toBe('#000000')
    })
  })
})
