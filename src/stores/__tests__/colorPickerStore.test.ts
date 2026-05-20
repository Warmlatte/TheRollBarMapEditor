import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useColorPickerStore } from '../colorPickerStore'
import { DEFAULT_TOOL_COLOR } from '../brushStore'
import { hexToHsv } from '../../lib/colorMath'

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

describe('colorPickerStore hexInput', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始化後 hexInput 等於 DEFAULT_TOOL_COLOR', () => {
    const store = useColorPickerStore()
    expect(store.hexInput).toBe(DEFAULT_TOOL_COLOR)
  })
})

describe('colorPickerStore applyHex', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('applyHex("#80ff40") 後 hexInput === "#80ff40"', () => {
    const store = useColorPickerStore()
    store.applyHex('#80ff40')
    expect(store.hexInput).toBe('#80ff40')
  })

  it('applyHex("#80ff40") 後 h/s/v 為對應 HSV 值', () => {
    const store = useColorPickerStore()
    store.applyHex('#80ff40')
    const expected = hexToHsv('#80ff40')
    expect(store.h).toBeCloseTo(expected.h, 5)
    expect(store.s).toBeCloseTo(expected.s, 5)
    expect(store.v).toBeCloseTo(expected.v, 5)
  })

  it('applyHex 後第一次 consumeSuppressFlag 回傳 true，第二次回傳 false', () => {
    const store = useColorPickerStore()
    store.applyHex('#80ff40')
    expect(store.consumeSuppressFlag()).toBe(true)
    expect(store.consumeSuppressFlag()).toBe(false)
  })

  it('後續呼叫 consumeSuppressFlag 繼續回傳 false 直到再次 applyHex', () => {
    const store = useColorPickerStore()
    store.applyHex('#80ff40')
    store.consumeSuppressFlag()
    expect(store.consumeSuppressFlag()).toBe(false)
    expect(store.consumeSuppressFlag()).toBe(false)
    store.applyHex('#ff0000')
    expect(store.consumeSuppressFlag()).toBe(true)
  })
})

describe('colorPickerStore consumeSuppressFlag', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('未呼叫 applyHex 時 consumeSuppressFlag 回傳 false', () => {
    const store = useColorPickerStore()
    expect(store.consumeSuppressFlag()).toBe(false)
  })
})

describe('colorPickerStore setHexInput', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('setHexInput("#ccddee") 後 hexInput === "#ccddee"', () => {
    const store = useColorPickerStore()
    store.setHexInput('#ccddee')
    expect(store.hexInput).toBe('#ccddee')
  })

  it('setHexInput 不改變 h/s/v', () => {
    const store = useColorPickerStore()
    const hBefore = store.h
    const sBefore = store.s
    const vBefore = store.v
    store.setHexInput('#ccddee')
    expect(store.h).toBe(hBefore)
    expect(store.s).toBe(sBefore)
    expect(store.v).toBe(vBefore)
  })

  it('setHexInput 不設 suppress flag', () => {
    const store = useColorPickerStore()
    store.setHexInput('#ccddee')
    expect(store.consumeSuppressFlag()).toBe(false)
  })
})
