import type { Hex, Icon, Line, Doodle, MapData } from '../../data/types'

export interface ToolContext {
  svgPoint(e: PointerEvent): { x: number; y: number }
  pixelToHex(x: number, y: number): { q: number; r: number }
  hexToPixel(q: number, r: number): { x: number; y: number }
  findHexAt(x: number, y: number): Hex | undefined
  findHexesInRadius(x: number, y: number, r: number): Hex[]
  findIconAt(x: number, y: number): Icon | undefined
  findLineAt(x: number, y: number): Line | undefined
  findDoodleAt(x: number, y: number): Doodle | undefined
  newId(): string
  readonly mapData: MapData
}

export interface ToolHandler {
  onPointerDown(ctx: ToolContext, e: PointerEvent): void
  onPointerMove(ctx: ToolContext, e: PointerEvent): void
  onPointerUp(ctx: ToolContext, e: PointerEvent): void
}
