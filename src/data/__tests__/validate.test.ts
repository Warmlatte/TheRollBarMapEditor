import { describe, it, expect } from 'vitest'
import { validateMapFile } from '../validate'

const minimalValid = {
  version: 1,
  name: '',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

describe('validateMapFile', () => {
  it('accepts a minimal valid MapFile', () => {
    expect(() => validateMapFile(minimalValid)).not.toThrow()
    const result = validateMapFile(minimalValid)
    expect(result).toEqual(minimalValid)
  })

  it('accepts a map with empty arrays', () => {
    const data = { ...minimalValid, name: 'test map' }
    expect(() => validateMapFile(data)).not.toThrow()
  })

  it('rejects version: 2', () => {
    const data = { ...minimalValid, version: 2 }
    expect(() => validateMapFile(data)).toThrow()
  })

  it('rejects missing version field', () => {
    const { version: _, ...noVersion } = minimalValid
    expect(() => validateMapFile(noVersion)).toThrow(/version/i)
  })

  it('rejects color "#fff" (short format)', () => {
    const data = {
      ...minimalValid,
      hexes: [{ q: 0, r: 0, color: '#fff' }],
    }
    expect(() => validateMapFile(data)).toThrow()
  })

  it('rejects color "red" (CSS named color)', () => {
    const data = {
      ...minimalValid,
      hexes: [{ q: 0, r: 0, color: 'red' }],
    }
    expect(() => validateMapFile(data)).toThrow()
  })
})

describe('validateMapFile — spec color examples', () => {
  it.each([
    ['#1a2b3c', true],
    ['#aabbcc', true],
    ['#000000', true],
    ['#ffffff', true],
  ])('accepts valid color %s', (color, _accepted) => {
    const data = { ...minimalValid, hexes: [{ q: 0, r: 0, color }] }
    expect(() => validateMapFile(data)).not.toThrow()
  })

  it.each([
    ['#FFF'],
    ['#FFFFFF'],
    ['red'],
    ['#gghhii'],
    ['rgba(0,0,0,1)'],
  ])('rejects invalid color %s', (color) => {
    const data = { ...minimalValid, hexes: [{ q: 0, r: 0, color }] }
    expect(() => validateMapFile(data)).toThrow()
  })
})

describe('validateMapFile — Icon x/y coordinates (pixel coords, breaking change)', () => {
  it('rejects icon with old q/r fields', () => {
    const data = {
      ...minimalValid,
      icons: [{ id: 'i1', q: 1, r: 2, svgId: 's', size: 40, rotation: 0, color: '#000000' }],
    }
    expect(() => validateMapFile(data)).toThrow()
  })

  it('accepts icon with new x/y pixel coordinate fields', () => {
    const data = {
      ...minimalValid,
      icons: [{ id: 'i1', x: 10.5, y: 20.0, svgId: 's', size: 40, rotation: 0, color: '#000000' }],
    }
    expect(() => validateMapFile(data)).not.toThrow()
    const result = validateMapFile(data)
    expect(result.icons[0]).toEqual({ id: 'i1', x: 10.5, y: 20.0, svgId: 's', size: 40, rotation: 0, color: '#000000' })
  })
})

describe('validateMapFile — line dashLength/dashGap fallback', () => {
  it('accepts a line without dashLength/dashGap and supplies defaults', () => {
    const data = {
      ...minimalValid,
      lines: [{ id: 'l1', x1: 0, y1: 0, x2: 10, y2: 10, width: 2, dashed: false, color: '#000000' }],
    }
    expect(() => validateMapFile(data)).not.toThrow()
    const result = validateMapFile(data)
    expect(result.lines[0]!.dashLength).toBe(8)
    expect(result.lines[0]!.dashGap).toBe(4)
  })

  it('accepts a line with explicit dashLength/dashGap and preserves them', () => {
    const data = {
      ...minimalValid,
      lines: [{ id: 'l1', x1: 0, y1: 0, x2: 10, y2: 10, width: 2, dashed: true, dashLength: 12, dashGap: 6, color: '#000000' }],
    }
    const result = validateMapFile(data)
    expect(result.lines[0]!.dashLength).toBe(12)
    expect(result.lines[0]!.dashGap).toBe(6)
  })
})

describe('validateMapFile — structuredClone compatibility', () => {
  it('produces independent copy via structuredClone', () => {
    const original = {
      ...minimalValid,
      hexes: [{ q: 0, r: 0, color: '#000000' }],
    }
    const validated = validateMapFile(original)
    const clone = structuredClone(validated)
    clone.hexes[0].color = '#ffffff'
    expect(validated.hexes[0].color).toBe('#000000')
  })
})
