import type { Command } from './types'
import type { MapData, Hex } from '../data/types'

type HexCoord = { q: number; r: number }

export class PaintHexCommand implements Command {
  constructor(
    private readonly coord: HexCoord,
    private readonly newColor: string,
  ) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const existing = state.hexes.find(h => h.q === this.coord.q && h.r === this.coord.r)
    const oldColor = existing?.color ?? null

    const hexes = existing
      ? state.hexes.map(h =>
          h.q === this.coord.q && h.r === this.coord.r ? { ...h, color: this.newColor } : h,
        )
      : [...state.hexes, { q: this.coord.q, r: this.coord.r, color: this.newColor }]

    const next: MapData = { ...state, hexes }

    const inverse: Command = oldColor !== null
      ? new PaintHexCommand(this.coord, oldColor)
      : new EraseHexCommand(this.coord)

    return { state: next, inverse }
  }
}

export class EraseHexCommand implements Command {
  constructor(private readonly coord: HexCoord) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const existing = state.hexes.find(h => h.q === this.coord.q && h.r === this.coord.r)
    const hexes = state.hexes.filter(h => !(h.q === this.coord.q && h.r === this.coord.r))
    const next: MapData = { ...state, hexes }

    const inverse: Command = existing
      ? new PaintHexCommand(this.coord, existing.color)
      : new EraseHexCommand(this.coord)

    return { state: next, inverse }
  }
}
