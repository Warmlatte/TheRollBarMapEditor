import { describe, it, expect } from 'vitest'
import { PlaceIconCommand, RemoveIconCommand } from '../iconCommands'
import type { MapData, Icon } from '../../data/types'

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

const testIcon: Icon = {
  id: 'icon-1',
  q: 2,
  r: 3,
  svgId: 'svg-1',
  size: 1,
  rotation: 0,
  color: '#000000',
}

describe('PlaceIconCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData()
    const cmd = new PlaceIconCommand(testIcon)
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData()
    const iconsBefore = state.icons
    const cmd = new PlaceIconCommand(testIcon)
    cmd.apply(state)
    expect(state.icons).toBe(iconsBefore)
  })

  it('adds icon to the state', () => {
    const state = makeMapData()
    const cmd = new PlaceIconCommand(testIcon)
    const { state: next } = cmd.apply(state)
    expect(next.icons).toContainEqual(testIcon)
  })

  it('round-trip restores original state', () => {
    const state = makeMapData()
    const cmd = new PlaceIconCommand(testIcon)
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    expect(restored.icons).toHaveLength(0)
    expect(restored).toEqual(state)
  })

  it('inverse removes exactly the placed icon by id', () => {
    const state = makeMapData()
    const cmd = new PlaceIconCommand(testIcon)
    const { state: next, inverse } = cmd.apply(state)
    expect(next.icons).toContainEqual(testIcon)
    const { state: afterInverse } = inverse.apply(next)
    expect(afterInverse.icons.find((i) => i.id === testIcon.id)).toBeUndefined()
  })
})

describe('RemoveIconCommand', () => {
  it('apply returns a new MapData reference', () => {
    const state = makeMapData({ icons: [testIcon] })
    const cmd = new RemoveIconCommand(testIcon.id)
    const { state: next } = cmd.apply(state)
    expect(next).not.toBe(state)
  })

  it('does not mutate the original state', () => {
    const state = makeMapData({ icons: [testIcon] })
    const iconsBefore = state.icons
    const cmd = new RemoveIconCommand(testIcon.id)
    cmd.apply(state)
    expect(state.icons).toBe(iconsBefore)
  })

  it('removes icon from the state', () => {
    const state = makeMapData({ icons: [testIcon] })
    const cmd = new RemoveIconCommand(testIcon.id)
    const { state: next } = cmd.apply(state)
    expect(next.icons).toHaveLength(0)
  })

  it('round-trip restores original state', () => {
    const state = makeMapData({ icons: [testIcon] })
    const cmd = new RemoveIconCommand(testIcon.id)
    const { state: next, inverse } = cmd.apply(state)
    const { state: restored } = inverse.apply(next)
    expect(restored.icons).toContainEqual(testIcon)
  })

  it('inverse restores all icon fields: svgId, coordinates, size, rotation, color', () => {
    const state = makeMapData({ icons: [testIcon] })
    const cmd = new RemoveIconCommand(testIcon.id)
    const { state: next, inverse } = cmd.apply(state)
    expect(next.icons).toHaveLength(0)
    const { state: restored } = inverse.apply(next)
    const icon = restored.icons.find((i) => i.id === testIcon.id)!
    expect(icon.svgId).toBe(testIcon.svgId)
    expect(icon.q).toBe(testIcon.q)
    expect(icon.r).toBe(testIcon.r)
    expect(icon.size).toBe(testIcon.size)
    expect(icon.rotation).toBe(testIcon.rotation)
    expect(icon.color).toBe(testIcon.color)
  })
})
