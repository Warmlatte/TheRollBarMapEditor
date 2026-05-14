import type { Command } from './types'
import type { MapData, Doodle } from '../data/types'

export class AddDoodleCommand implements Command {
  constructor(private readonly doodle: Doodle) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const next: MapData = { ...state, doodles: [...state.doodles, this.doodle] }
    return { state: next, inverse: new RemoveDoodleCommand(this.doodle.id) }
  }
}

export class RemoveDoodleCommand implements Command {
  constructor(private readonly doodleId: string) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const existing = state.doodles.find(d => d.id === this.doodleId)
    const doodles = state.doodles.filter(d => d.id !== this.doodleId)
    const next: MapData = { ...state, doodles }

    const inverse: Command = existing
      ? new AddDoodleCommand(existing)
      : new RemoveDoodleCommand(this.doodleId)

    return { state: next, inverse }
  }
}
