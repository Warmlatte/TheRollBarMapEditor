import { describe, it, expect } from 'vitest'
import { BatchCommand } from '../batchCommand'
import type { Command } from '../types'
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

describe('BatchCommand', () => {
  it('empty inverses array does not throw', () => {
    const state = makeMapData()
    const batch = new BatchCommand([])
    expect(() => batch.apply(state)).not.toThrow()
  })

  it('executes 3 mock inverses in reverse order', () => {
    const executionOrder: number[] = []

    const makeCmd = (index: number): Command => ({
      apply(state: MapData) {
        executionOrder.push(index)
        return { state, inverse: makeCmd(index) }
      },
    })

    const inverses = [makeCmd(0), makeCmd(1), makeCmd(2)]
    const batch = new BatchCommand(inverses)
    const state = makeMapData()
    batch.apply(state)

    expect(executionOrder).toEqual([2, 1, 0])
  })

  it('round-trip fully restores original state', () => {
    // A command that appends a hex when applied, inverse removes it
    const originalState = makeMapData()
    const hex = { q: 1, r: 1, color: '#ff0000' }

    const addCmd: Command = {
      apply(state: MapData) {
        const next = { ...state, hexes: [...state.hexes, hex] }
        return { state: next, inverse: removeCmd }
      },
    }

    const removeCmd: Command = {
      apply(state: MapData) {
        const next = { ...state, hexes: state.hexes.filter(h => !(h.q === hex.q && h.r === hex.r)) }
        return { state: next, inverse: addCmd }
      },
    }

    // Apply addCmd to get next state, capturing inverse
    const { state: afterAdd, inverse: addInverse } = addCmd.apply(originalState)
    expect(afterAdd.hexes).toHaveLength(1)

    // Wrap the inverse in a BatchCommand
    const batch = new BatchCommand([addInverse])
    const { state: restored } = batch.apply(afterAdd)

    expect(restored.hexes).toHaveLength(0)
    expect(restored).toEqual(originalState)
  })

  it('inverse is a new BatchCommand that collects inverses from sub-commands', () => {
    const makeCmd = (): Command => ({
      apply(state: MapData) {
        return { state, inverse: makeCmd() }
      },
    })

    const batch = new BatchCommand([makeCmd(), makeCmd()])
    const state = makeMapData()
    const { inverse } = batch.apply(state)

    expect(inverse).toBeInstanceOf(BatchCommand)
  })
})
