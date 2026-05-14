import type { MapData } from '../data/types'

export interface Command {
  apply(state: MapData): { state: MapData; inverse: Command }
}
