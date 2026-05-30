import { useMapStore } from '../../stores/mapStore'
import { useEraseStore } from '../../stores/eraseStore'
import { EraseHexCommand } from '../../commands/hexCommands'
import { RemoveIconCommand } from '../../commands/iconCommands'
import { RemoveLineCommand } from '../../commands/lineCommands'
import { RemoveDoodleCommand } from '../../commands/doodleCommands'
import type { ToolContext, ToolHandler } from './types'

let dragging = false
let erasedThisDrag = new Set<string>()

export function _resetEraseToolForTest(): void {
  dragging = false
  erasedThisDrag = new Set()
}

function eraseAt(ctx: ToolContext, x: number, y: number): void {
  const mapStore = useMapStore()
  const eraseStore = useEraseStore()
  const { radius, targets } = eraseStore

  if (targets.hex) {
    for (const h of ctx.findHexesInRadius(x, y, radius)) {
      const key = `hex:${h.q},${h.r}`
      if (!erasedThisDrag.has(key)) {
        erasedThisDrag.add(key)
        mapStore.dispatch(new EraseHexCommand({ q: h.q, r: h.r }))
      }
    }
  }

  if (targets.icon) {
    for (const icon of ctx.findIconsInRadius(x, y, radius)) {
      const key = `icon:${icon.id}`
      if (!erasedThisDrag.has(key)) {
        erasedThisDrag.add(key)
        mapStore.dispatch(new RemoveIconCommand(icon.id))
      }
    }
  }

  if (targets.line) {
    for (const line of ctx.findLinesInRadius(x, y, radius)) {
      const key = `line:${line.id}`
      if (!erasedThisDrag.has(key)) {
        erasedThisDrag.add(key)
        mapStore.dispatch(new RemoveLineCommand(line.id))
      }
    }
  }

  if (targets.doodle) {
    for (const doodle of ctx.findDoodlesInRadius(x, y, radius)) {
      const key = `doodle:${doodle.id}`
      if (!erasedThisDrag.has(key)) {
        erasedThisDrag.add(key)
        mapStore.dispatch(new RemoveDoodleCommand(doodle.id))
      }
    }
  }
}

export const eraseHandler: ToolHandler = {
  onPointerDown(ctx, e) {
    if (e.button !== 0) return
    e.preventDefault()

    const eraseStore = useEraseStore()
    const { targets } = eraseStore
    if (!targets.hex && !targets.icon && !targets.line && !targets.doodle) return

    const mapStore = useMapStore()
    mapStore.beginStroke()
    erasedThisDrag = new Set()
    dragging = true

    const { x, y } = ctx.svgPoint(e)
    eraseAt(ctx, x, y)
    ctx.tryCapture(e.pointerId)
  },

  onPointerMove(ctx, e) {
    if (!dragging) return
    const { x, y } = ctx.svgPoint(e)
    eraseAt(ctx, x, y)
  },

  onPointerUp(ctx, e) {
    if (!dragging) return
    const mapStore = useMapStore()
    mapStore.endStroke()
    ctx.tryRelease(e.pointerId)
    dragging = false
    erasedThisDrag = new Set()
  },

  onPointerCancel(ctx, e) {
    if (!dragging) return
    const mapStore = useMapStore()
    mapStore.endStroke()
    ctx.tryRelease(e.pointerId)
    dragging = false
    erasedThisDrag = new Set()
  },

  isDragging() {
    return dragging
  },
}
