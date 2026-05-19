import { describe, it, expect } from 'vitest'
import { snapPoint } from '../snap'

const HEX_SIZE = 40
const SQRT3 = Math.sqrt(3)

// Snap points for hex (q=0, r=0) with center at (0, 0), hexSize=40
// Using pointy-top convention: corner angles = 60*i - 30 degrees
const HEX_CENTER_X = 0
const HEX_CENTER_Y = 0
// Corner i=0 at angle -30°: x = 40*cos(-30°) = 20√3, y = 40*sin(-30°) = -20
const CORNER_X = HEX_SIZE * SQRT3 / 2  // ≈ 34.641
const CORNER_Y = -HEX_SIZE / 2         // = -20
// Edge midpoint between corner i=5 (270°: (0,-40)) and corner i=0 (-30°): avg = (10√3, -30)
const EDGE_MID_X = HEX_SIZE * SQRT3 / 4  // = 10√3 ≈ 17.321
const EDGE_MID_Y = -HEX_SIZE * 3 / 4    // = -30

describe('snapPoint — free mode', () => {
  it('returns raw coordinates unchanged', () => {
    expect(snapPoint(55, 33, 'free', HEX_SIZE)).toEqual({ x: 55, y: 33 })
  })

  it('returns raw coordinates for any input', () => {
    expect(snapPoint(-100, 200.5, 'free', HEX_SIZE)).toEqual({ x: -100, y: 200.5 })
  })
})

describe('snapPoint — node mode: selects nearest center', () => {
  it('snaps to hex center when cursor is at center', () => {
    const result = snapPoint(HEX_CENTER_X, HEX_CENTER_Y, 'node', HEX_SIZE)
    expect(result.x).toBeCloseTo(HEX_CENTER_X, 5)
    expect(result.y).toBeCloseTo(HEX_CENTER_Y, 5)
  })

  it('snaps to center when cursor is slightly offset from center', () => {
    const result = snapPoint(1, 1, 'node', HEX_SIZE)
    expect(result.x).toBeCloseTo(HEX_CENTER_X, 5)
    expect(result.y).toBeCloseTo(HEX_CENTER_Y, 5)
  })
})

describe('snapPoint — node mode: selects nearest corner', () => {
  it('snaps to corner when cursor is at corner position', () => {
    const result = snapPoint(CORNER_X, CORNER_Y, 'node', HEX_SIZE)
    expect(result.x).toBeCloseTo(CORNER_X, 5)
    expect(result.y).toBeCloseTo(CORNER_Y, 5)
  })

  it('snaps to corner when cursor is very close to it', () => {
    const result = snapPoint(CORNER_X + 0.1, CORNER_Y + 0.1, 'node', HEX_SIZE)
    expect(result.x).toBeCloseTo(CORNER_X, 1)
    expect(result.y).toBeCloseTo(CORNER_Y, 1)
  })
})

describe('snapPoint — node mode: selects nearest edge midpoint', () => {
  it('snaps to edge midpoint when cursor is at midpoint position', () => {
    const result = snapPoint(EDGE_MID_X, EDGE_MID_Y, 'node', HEX_SIZE)
    expect(result.x).toBeCloseTo(EDGE_MID_X, 5)
    expect(result.y).toBeCloseTo(EDGE_MID_Y, 5)
  })

  it('snaps to edge midpoint when cursor is very close to it', () => {
    const result = snapPoint(EDGE_MID_X + 0.1, EDGE_MID_Y + 0.1, 'node', HEX_SIZE)
    expect(result.x).toBeCloseTo(EDGE_MID_X, 1)
    expect(result.y).toBeCloseTo(EDGE_MID_Y, 1)
  })
})

describe('snapPoint — node mode: spec example', () => {
  it('snaps cursor at (0,0) to hex center (q=0,r=0) at (0,0)', () => {
    const result = snapPoint(0, 0, 'node', HEX_SIZE)
    expect(result.x).toBeCloseTo(0, 5)
    expect(result.y).toBeCloseTo(0, 5)
  })
})
