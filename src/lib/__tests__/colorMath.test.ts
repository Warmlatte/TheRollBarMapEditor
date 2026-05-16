import { describe, it, expect } from 'vitest'
import { hsvToHex, hexToHsv } from '../colorMath'

describe('hsvToHex', () => {
  it.each([
    [0, 0, 0, '#000000'],
    [0, 0, 1, '#ffffff'],
    [0, 1, 1, '#ff0000'],
    [120, 1, 1, '#00ff00'],
    [240, 1, 1, '#0000ff'],
    [60, 1, 1, '#ffff00'],
    [180, 1, 1, '#00ffff'],
    [300, 1, 1, '#ff00ff'],
  ])('hsvToHex(%i, %i, %i) = %s', (h, s, v, expected) => {
    expect(hsvToHex(h, s, v)).toBe(expected)
  })
})

describe('hexToHsv', () => {
  it('round-trip: hexToHsv -> hsvToHex within 1/255 tolerance', () => {
    const cases = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#6366f1', '#ab12cd']
    for (const hex of cases) {
      const { h, s, v } = hexToHsv(hex)
      const result = hsvToHex(h, s, v)
      const toChannel = (str: string, offset: number) =>
        parseInt(str.slice(offset, offset + 2), 16)
      const diff = (a: string, b: string) =>
        Math.max(
          Math.abs(toChannel(a, 1) - toChannel(b, 1)),
          Math.abs(toChannel(a, 3) - toChannel(b, 3)),
          Math.abs(toChannel(a, 5) - toChannel(b, 5)),
        )
      expect(diff(hex, result)).toBeLessThanOrEqual(1)
    }
  })

  it('#ff0000 -> h=0, s=1, v=1', () => {
    const { h, s, v } = hexToHsv('#ff0000')
    expect(h).toBeCloseTo(0, 0)
    expect(s).toBeCloseTo(1, 5)
    expect(v).toBeCloseTo(1, 5)
  })

  it('#000000 -> s=0, v=0', () => {
    const { s, v } = hexToHsv('#000000')
    expect(s).toBe(0)
    expect(v).toBe(0)
  })

  it('#ffffff -> s=0, v=1', () => {
    const { s, v } = hexToHsv('#ffffff')
    expect(s).toBe(0)
    expect(v).toBe(1)
  })
})
