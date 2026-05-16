import type { ToolHandler } from '../render/toolHandlers/types'
import type { Tool } from '../stores/brushStore'

const noopHandler: ToolHandler = {
  onPointerDown: () => undefined,
  onPointerMove: () => undefined,
  onPointerUp: () => undefined,
}

const registry: Record<Tool, ToolHandler> = {
  paint: noopHandler,
  erase: noopHandler,
  icon: noopHandler,
  line: noopHandler,
  doodle: noopHandler,
}

export function getHandler(tool: Tool): ToolHandler {
  return registry[tool] ?? noopHandler
}

export function registerHandler(tool: Tool, handler: ToolHandler): void {
  registry[tool] = handler
}
