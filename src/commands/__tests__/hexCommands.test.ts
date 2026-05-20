import { describe, it, expect } from 'vitest'
import { PaintHexCommand, EraseHexCommand } from '../hexCommands'
import type { MapData } from '../../data/types'

function makeMapData(overrides: Partial<MapData> = {}): MapData {
  return {
    name: 'test',
    bounds: { radius: 3 },
    hexes: [],
    icons: [],
    lines: [],
    doodles: [],
    ...overrides,
  }
}

describe('PaintHexCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData()
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData()
    const hexesBefore = state.hexes
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    cmd.apply(state)
    expect(state.hexes).toBe(hexesBefore)
  })

  it('adds hex with new color when no hex existed', () => {
    const state = makeMapData()
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    const { state: next } = cmd.apply(state)
    expect(next.hexes).toContainEqual({ q: 1, r: 1, color: '#ff0000' })
  })

  it('updates hex color when hex already existed', () => {
    const state = makeMapData({ hexes: [{ q: 1, r: 1, color: '#ffffff' }] })
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    const { state: next } = cmd.apply(state)
    expect(next.hexes).toContainEqual({ q: 1, r: 1, color: '#ff0000' })
    expect(next.hexes).toHaveLength(1)
  })

  it('round-trip restores original state (spec example)', () => {
    // GIVEN a MapData with hex at (1,1) colored #ffffff
    const state = makeMapData({ hexes: [{ q: 1, r: 1, color: '#ffffff' }] })
    // WHEN PaintHexCommand({q:1,r:1}, '#ff0000').apply(state) then inverse.apply(next)
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    // THEN hex at (1,1) is #ffffff again
    expect(restored.hexes).toContainEqual({ q: 1, r: 1, color: '#ffffff' })
  })
})

describe('PaintHexCommand same-color no-op', () => {
  it('同色重塗 apply 回傳的 state 為原 state（=== 相等）且 inverse === 命令自身', () => {
    const state = makeMapData({ hexes: [{ q: 1, r: 2, color: '#ff0000' }] })
    const cmd = new PaintHexCommand({ q: 1, r: 2 }, '#ff0000')
    const { state: next, inverse } = cmd.apply(state)
    expect(next).toBe(state)
    expect(inverse).toBe(cmd)
  })

  it('不同色重塗仍產生新 state reference', () => {
    const state = makeMapData({ hexes: [{ q: 1, r: 2, color: '#ff0000' }] })
    const cmd = new PaintHexCommand({ q: 1, r: 2 }, '#0000ff')
    const { state: next, inverse } = cmd.apply(state)
    expect(next).not.toBe(state)
    expect(inverse).not.toBe(cmd)
  })
})

describe('EraseHexCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData({ hexes: [{ q: 1, r: 1, color: '#ff0000' }] })
    const cmd = new EraseHexCommand({ q: 1, r: 1 })
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData({ hexes: [{ q: 1, r: 1, color: '#ff0000' }] })
    const hexesBefore = state.hexes
    const cmd = new EraseHexCommand({ q: 1, r: 1 })
    cmd.apply(state)
    expect(state.hexes).toBe(hexesBefore)
  })

  it('removes the hex from the state', () => {
    const state = makeMapData({ hexes: [{ q: 1, r: 1, color: '#ff0000' }] })
    const cmd = new EraseHexCommand({ q: 1, r: 1 })
    const { state: next } = cmd.apply(state)
    expect(next.hexes).toHaveLength(0)
  })

  it('round-trip restores original state', () => {
    const state = makeMapData({ hexes: [{ q: 1, r: 1, color: '#ff0000' }] })
    const cmd = new EraseHexCommand({ q: 1, r: 1 })
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    expect(restored.hexes).toContainEqual({ q: 1, r: 1, color: '#ff0000' })
  })

  it('erase nonexistent hex is a no-op (returns same data shape)', () => {
    const state = makeMapData()
    const cmd = new EraseHexCommand({ q: 99, r: 99 })
    const { state: next } = cmd.apply(state)
    expect(next.hexes).toHaveLength(0)
  })
})
