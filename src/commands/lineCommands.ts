import type { Command } from './types'
import type { MapData, Line } from '../data/types'

export class DrawLineCommand implements Command {
  constructor(private readonly line: Line) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const next: MapData = { ...state, lines: [...state.lines, this.line] }
    return { state: next, inverse: new RemoveLineCommand(this.line.id) }
  }
}

export class RemoveLineCommand implements Command {
  constructor(private readonly lineId: string) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const existing = state.lines.find(l => l.id === this.lineId)
    const lines = state.lines.filter(l => l.id !== this.lineId)
    const next: MapData = { ...state, lines }

    const inverse: Command = existing
      ? new DrawLineCommand(existing)
      : new RemoveLineCommand(this.lineId)

    return { state: next, inverse }
  }
}
