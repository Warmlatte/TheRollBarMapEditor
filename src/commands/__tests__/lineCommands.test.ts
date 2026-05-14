import { describe, it, expect } from 'vitest'
import { DrawLineCommand, RemoveLineCommand } from '../lineCommands'
import type { MapData, Line } from '../../data/types'

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

const testLine: Line = {
  id: 'line-1',
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 100,
  width: 2,
  dashed: false,
  color: '#000000',
}

describe('DrawLineCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData()
    const cmd = new DrawLineCommand(testLine)
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData()
    const linesBefore = state.lines
    const cmd = new DrawLineCommand(testLine)
    cmd.apply(state)
    expect(state.lines).toBe(linesBefore)
  })

  it('adds line to the state', () => {
    const state = makeMapData()
    const cmd = new DrawLineCommand(testLine)
    const { state: next } = cmd.apply(state)
    expect(next.lines).toContainEqual(testLine)
  })

  it('round-trip restores original state', () => {
    const state = makeMapData()
    const cmd = new DrawLineCommand(testLine)
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    expect(restored.lines).toHaveLength(0)
    expect(restored).toEqual(state)
  })
})

describe('RemoveLineCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData({ lines: [testLine] })
    const cmd = new RemoveLineCommand(testLine.id)
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData({ lines: [testLine] })
    const linesBefore = state.lines
    const cmd = new RemoveLineCommand(testLine.id)
    cmd.apply(state)
    expect(state.lines).toBe(linesBefore)
  })

  it('removes line from the state', () => {
    const state = makeMapData({ lines: [testLine] })
    const cmd = new RemoveLineCommand(testLine.id)
    const { state: next } = cmd.apply(state)
    expect(next.lines).toHaveLength(0)
  })

  it('round-trip restores original state', () => {
    const state = makeMapData({ lines: [testLine] })
    const cmd = new RemoveLineCommand(testLine.id)
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    expect(restored.lines).toContainEqual(testLine)
  })
})
