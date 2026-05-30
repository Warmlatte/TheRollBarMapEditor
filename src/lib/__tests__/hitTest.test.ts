import { describe, it, expect } from 'vitest'
import { findHexesInRadius, findIconAt, findIconsInRadius, findLinesInRadius, findDoodlesInRadius } from '../hitTest'
import { HEX_SIZE, hexToPixel } from '../hexMath'
import type { Hex, Icon, Line, Doodle } from '../../data/types'

function makeHex(q: number, r: number): Hex {
  return { q, r, color: '#ff0000' }
}

function makeIcon(id: string, x: number, y: number): Icon {
  return { id, x, y, svgId: 'test', size: 40, rotation: 0, color: '#000000' }
}

function makeLine(id: string, x1: number, y1: number, x2: number, y2: number): Line {
  return { id, x1, y1, x2, y2, width: 2, dashed: false, dashLength: 8, dashGap: 4, color: '#000000' }
}

function makeDoodle(id: string, points: Array<{ x: number; y: number }>): Doodle {
  return { id, points, width: 2, opacity: 1, color: '#000000' }
}

describe('findHexesInRadius', () => {
  it('uses SVG pixel radius instead of hex-step distance', () => {
    const center = makeHex(0, 0)
    const adjacent = makeHex(1, 0)
    const { x, y } = hexToPixel(0, 0)

    const result = findHexesInRadius([center, adjacent], x, y, 5)

    expect(result).toEqual([center])
  })
})

describe('findIconAt — pixel coordinate hit detection', () => {
  it('returns undefined when icons list is empty', () => {
    expect(findIconAt([], 0, 0)).toBeUndefined()
  })

  it('returns icon when cursor is within HEX_SIZE of icon pixel position', () => {
    const icon = makeIcon('a', 100, 80)
    const result = findIconAt([icon], 100, 80)
    expect(result).toBe(icon)
  })

  it('returns icon when cursor is exactly HEX_SIZE away', () => {
    const icon = makeIcon('a', 0, 0)
    const result = findIconAt([icon], HEX_SIZE, 0)
    expect(result).toBe(icon)
  })

  it('returns undefined when cursor is farther than HEX_SIZE from all icons', () => {
    const icon = makeIcon('a', 0, 0)
    const result = findIconAt([icon], HEX_SIZE + 1, 0)
    expect(result).toBeUndefined()
  })

  it('returns the last icon in array when multiple icons are in range', () => {
    const iconA = makeIcon('a', 100, 80)
    const iconB = makeIcon('b', 100, 80)
    const result = findIconAt([iconA, iconB], 100, 80)
    expect(result?.id).toBe('b')
  })

  it('does not use hexToPixel conversion (pixel coords used directly)', () => {
    // icon at pixel (100, 80), cursor also at (100, 80) — should hit
    const icon = makeIcon('a', 100, 80)
    expect(findIconAt([icon], 100, 80)).toBe(icon)
    // icon at pixel (0, 0) means hexToPixel(q,r) would return a hex center,
    // but we now check direct pixel distance
    const iconAtOrigin = makeIcon('b', 0, 0)
    expect(findIconAt([iconAtOrigin], 0, 0)).toBe(iconAtOrigin)
  })
})

describe('findIconsInRadius', () => {
  it('returns only icons whose center distance is <= r (spec example)', () => {
    const icons = [makeIcon('a', 30, 0), makeIcon('b', 80, 0)]
    const result = findIconsInRadius(icons, 0, 0, 50)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('a')
  })

  it('includes icon whose center is exactly at r', () => {
    const icon = makeIcon('a', 50, 0)
    expect(findIconsInRadius([icon], 0, 0, 50)).toHaveLength(1)
  })

  it('excludes icon just beyond r', () => {
    const icon = makeIcon('a', 51, 0)
    expect(findIconsInRadius([icon], 0, 0, 50)).toHaveLength(0)
  })

  it('returns empty array when icons list is empty', () => {
    expect(findIconsInRadius([], 0, 0, 50)).toHaveLength(0)
  })
})

describe('findLinesInRadius', () => {
  it('returns horizontal line when point is within r of it', () => {
    const line = makeLine('a', 0, 0, 100, 0)
    const result = findLinesInRadius([line], 50, 30, 50)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('a')
  })

  it('returns line when point is within r of an endpoint', () => {
    const line = makeLine('a', 0, 0, 100, 0)
    const result = findLinesInRadius([line], 0, 40, 50)
    expect(result).toHaveLength(1)
  })

  it('excludes line when point is outside r from entire segment', () => {
    const line = makeLine('a', 0, 0, 100, 0)
    const result = findLinesInRadius([line], 50, 60, 50)
    expect(result).toHaveLength(0)
  })
})

describe('findDoodlesInRadius', () => {
  it('returns doodle when any point is within r', () => {
    const doodle = makeDoodle('a', [{ x: 20, y: 0 }, { x: 200, y: 200 }])
    const result = findDoodlesInRadius([doodle], 0, 0, 50)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('a')
  })

  it('excludes doodle when all points are outside r', () => {
    const doodle = makeDoodle('a', [{ x: 200, y: 0 }, { x: 300, y: 300 }])
    const result = findDoodlesInRadius([doodle], 0, 0, 50)
    expect(result).toHaveLength(0)
  })
})
