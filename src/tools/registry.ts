import type { Component } from 'vue'
import type { ToolHandler } from '../render/toolHandlers/types'
import PaintToolHud from '../components/PaintToolHud.vue'
import IconToolHud from '../components/IconToolHud.vue'
import LineToolHud from '../components/LineToolHud.vue'
import DoodleToolHud from '../components/DoodleToolHud.vue'
import EraseToolHud from '../components/EraseToolHud.vue'

export type ToolVariant = 'default' | 'danger'

export type ToolDef = {
  id: string
  handler: ToolHandler
  hud: Component
  i18nKey: string
  variant?: ToolVariant
}

const noop = (): void => undefined

export const paintHandler: ToolHandler = {
  onPointerDown: noop,
  onPointerMove: noop,
  onPointerUp: noop,
}

export const iconHandler: ToolHandler = {
  onPointerDown: noop,
  onPointerMove: noop,
  onPointerUp: noop,
}

export const lineHandler: ToolHandler = {
  onPointerDown: noop,
  onPointerMove: noop,
  onPointerUp: noop,
}

export const doodleHandler: ToolHandler = {
  onPointerDown: noop,
  onPointerMove: noop,
  onPointerUp: noop,
}

export const eraseHandler: ToolHandler = {
  onPointerDown: noop,
  onPointerMove: noop,
  onPointerUp: noop,
}

export const TOOLS: ToolDef[] = [
  { id: 'paint',  handler: paintHandler,  hud: PaintToolHud,  i18nKey: 'tool.paint' },
  { id: 'icon',   handler: iconHandler,   hud: IconToolHud,   i18nKey: 'tool.icon' },
  { id: 'line',   handler: lineHandler,   hud: LineToolHud,   i18nKey: 'tool.line' },
  { id: 'doodle', handler: doodleHandler, hud: DoodleToolHud, i18nKey: 'tool.doodle' },
  { id: 'erase',  handler: eraseHandler,  hud: EraseToolHud,  i18nKey: 'tool.erase', variant: 'danger' },
]

export function getHandler(toolId: string): ToolHandler {
  const def = TOOLS.find(t => t.id === toolId)
  if (!def) throw new Error(`Unknown tool: ${toolId}`)
  return def.handler
}
