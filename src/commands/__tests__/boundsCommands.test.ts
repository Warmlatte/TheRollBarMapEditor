import { describe, it, expect } from 'vitest'
import { SetMapBoundsCommand } from '../boundsCommands'
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

describe('SetMapBoundsCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData()
    const cmd = new SetMapBoundsCommand({ radius: 5 })
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData()
    const boundsBefore = state.bounds
    const cmd = new SetMapBoundsCommand({ radius: 5 })
    cmd.apply(state)
    expect(state.bounds).toBe(boundsBefore)
  })

  it('updates bounds in the state', () => {
    const state = makeMapData({ bounds: { radius: 3 } })
    const cmd = new SetMapBoundsCommand({ radius: 7 })
    const { state: next } = cmd.apply(state)
    expect(next.bounds).toEqual({ radius: 7 })
  })

  it('round-trip restores original bounds', () => {
    const state = makeMapData({ bounds: { radius: 3 } })
    const cmd = new SetMapBoundsCommand({ radius: 7 })
    const { state: next, inverse } = cmd.apply(state)
    expect(next.bounds).toEqual({ radius: 7 })
    const { state: restored } = inverse.apply(next)
    expect(restored.bounds).toEqual({ radius: 3 })
  })

  it('inverse is a SetMapBoundsCommand restoring old bounds', () => {
    const state = makeMapData({ bounds: { radius: 3 } })
    const cmd = new SetMapBoundsCommand({ radius: 5 })
    const { inverse } = cmd.apply(state)
    expect(inverse).toBeInstanceOf(SetMapBoundsCommand)
  })
})
