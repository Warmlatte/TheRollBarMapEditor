import type { Command } from './types'
import type { MapData, Icon } from '../data/types'

export class PlaceIconCommand implements Command {
  constructor(private readonly icon: Icon) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const next: MapData = { ...state, icons: [...state.icons, this.icon] }
    return { state: next, inverse: new RemoveIconCommand(this.icon.id) }
  }
}

export class RemoveIconCommand implements Command {
  constructor(private readonly iconId: string) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const existing = state.icons.find(i => i.id === this.iconId)
    const icons = state.icons.filter(i => i.id !== this.iconId)
    const next: MapData = { ...state, icons }

    const inverse: Command = existing
      ? new PlaceIconCommand(existing)
      : new RemoveIconCommand(this.iconId)

    return { state: next, inverse }
  }
}
