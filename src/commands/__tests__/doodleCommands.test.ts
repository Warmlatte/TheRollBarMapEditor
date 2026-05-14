import { describe, it, expect } from 'vitest'
import { AddDoodleCommand, RemoveDoodleCommand } from '../doodleCommands'
import type { MapData, Doodle } from '../../data/types'

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

const testDoodle: Doodle = {
  id: 'doodle-1',
  points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
  width: 3,
  opacity: 0.8,
  color: '#ff0000',
}

describe('AddDoodleCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData()
    const cmd = new AddDoodleCommand(testDoodle)
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData()
    const doodlesBefore = state.doodles
    const cmd = new AddDoodleCommand(testDoodle)
    cmd.apply(state)
    expect(state.doodles).toBe(doodlesBefore)
  })

  it('adds doodle to the state', () => {
    const state = makeMapData()
    const cmd = new AddDoodleCommand(testDoodle)
    const { state: next } = cmd.apply(state)
    expect(next.doodles).toContainEqual(testDoodle)
  })

  it('round-trip restores original state', () => {
    const state = makeMapData()
    const cmd = new AddDoodleCommand(testDoodle)
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    expect(restored.doodles).toHaveLength(0)
    expect(restored).toEqual(state)
  })
})

describe('RemoveDoodleCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData({ doodles: [testDoodle] })
    const cmd = new RemoveDoodleCommand(testDoodle.id)
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData({ doodles: [testDoodle] })
    const doodlesBefore = state.doodles
    const cmd = new RemoveDoodleCommand(testDoodle.id)
    cmd.apply(state)
    expect(state.doodles).toBe(doodlesBefore)
  })

  it('removes doodle from the state', () => {
    const state = makeMapData({ doodles: [testDoodle] })
    const cmd = new RemoveDoodleCommand(testDoodle.id)
    const { state: next } = cmd.apply(state)
    expect(next.doodles).toHaveLength(0)
  })

  it('round-trip restores original state', () => {
    const state = makeMapData({ doodles: [testDoodle] })
    const cmd = new RemoveDoodleCommand(testDoodle.id)
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    expect(restored.doodles).toContainEqual(testDoodle)
  })
})
