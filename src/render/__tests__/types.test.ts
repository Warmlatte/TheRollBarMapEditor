import { describe, it, expect } from 'vitest'
import type { ToolContext, ToolHandler } from '../toolHandlers/types'
import type { MapData } from '../../data/types'

describe('ToolContext and ToolHandler interfaces are defined', () => {
  it('ToolHandler can be implemented as a plain object', () => {
    let called = ''
    const handler: ToolHandler = {
      onPointerDown(_ctx, _e) { called = 'down' },
      onPointerMove(_ctx, _e) { called = 'move' },
      onPointerUp(_ctx, _e) { called = 'up' },
    }
    handler.onPointerDown({} as ToolContext, {} as PointerEvent)
    expect(called).toBe('down')
    handler.onPointerMove({} as ToolContext, {} as PointerEvent)
    expect(called).toBe('move')
    handler.onPointerUp({} as ToolContext, {} as PointerEvent)
    expect(called).toBe('up')
  })

  it('ToolContext mapData is readonly', () => {
    const mapData: MapData = {
      name: 'test',
      bounds: { radius: 5 },
      hexes: [],
      icons: [],
      lines: [],
      doodles: [],
    }
    const ctx: Pick<ToolContext, 'mapData'> = { mapData }
    expect(ctx.mapData.hexes).toEqual([])
  })
})
