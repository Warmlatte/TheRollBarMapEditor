import type { Command } from './types'
import type { MapData } from '../data/types'

export class BatchCommand implements Command {
  constructor(private readonly inverses: Command[]) {}

  apply(state: MapData): { state: MapData; inverse: Command } {
    const collectedInverses: Command[] = []
    let current = state

    for (let i = this.inverses.length - 1; i >= 0; i--) {
      const result = this.inverses[i].apply(current)
      current = result.state
      collectedInverses.push(result.inverse)
    }

    return { state: current, inverse: new BatchCommand(collectedInverses) }
  }
}
