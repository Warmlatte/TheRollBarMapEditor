import { describe, it, expect } from 'vitest'
import { findIconAt } from '../hitTest'
import { HEX_SIZE } from '../hexMath'
import type { Icon } from '../../data/types'

function makeIcon(id: string, x: number, y: number): Icon {
  return { id, x, y, svgId: 'test', size: 40, rotation: 0, color: '#000000' }
}

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
