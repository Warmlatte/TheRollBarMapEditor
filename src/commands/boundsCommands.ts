import type { Command } from './types'
import type { MapData, Bounds } from '../data/types'

export class SetMapBoundsCommand implements Command {
  constructor(private readonly newBounds: Bounds) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const oldBounds = state.bounds
    const next: MapData = { ...state, bounds: { ...this.newBounds } }
    return { state: next, inverse: new SetMapBoundsCommand(oldBounds) }
  }
}
