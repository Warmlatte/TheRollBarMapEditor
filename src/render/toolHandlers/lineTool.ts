import { useMapStore } from '../../stores/mapStore'
import { useLineStore } from '../../stores/lineStore'
import { useSnapStore } from '../../stores/snapStore'
import { useBrushStore } from '../../stores/brushStore'
import { DrawLineCommand, RemoveLineCommand } from '../../commands/lineCommands'
import { snapPoint } from '../../lib/snap'
import { HEX_SIZE } from '../../lib/hexMath'
import type { ToolHandler } from './types'

let dragErasing = false
let lastErasedLineId: string | null = null

export function _resetLineToolForTest(): void {
  dragErasing = false
  lastErasedLineId = null
}

export const lineHandler: ToolHandler = {
  onPointerDown(ctx, e): void {
    if (e.button !== 0) return

    const mapStore = useMapStore()
    const lineStore = useLineStore()
    const snapStore = useSnapStore()
    const brushStore = useBrushStore()

    const { x: rawX, y: rawY } = ctx.svgPoint(e)
    const snap = snapPoint(rawX, rawY, snapStore.snapMode, HEX_SIZE)

    if (e.shiftKey) {
      dragErasing = true
      lastErasedLineId = null
      mapStore.beginStroke()
      const hit = ctx.findLineAt(rawX, rawY)
      if (hit) {
        mapStore.dispatch(new RemoveLineCommand(hit.id))
        lastErasedLineId = hit.id
      }
      return
    }

    const anchor = lineStore.pendingAnchor
    if (anchor === null) {
      lineStore.pendingAnchor = snap
      return
    }

    const dx = snap.x - anchor.x
    const dy = snap.y - anchor.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 1) {
      lineStore.pendingAnchor = null
      lineStore.previewEnd = null
      return
    }

    mapStore.dispatch(
      new DrawLineCommand({
        id: ctx.newId(),
        x1: anchor.x,
        y1: anchor.y,
        x2: snap.x,
        y2: snap.y,
        width: lineStore.lineWidth,
        dashed: lineStore.dashed,
        dashLength: lineStore.dashLength,
        dashGap: lineStore.dashGap,
        color: brushStore.currentColor,
      }),
    )
    lineStore.pendingAnchor = snap
  },

  onPointerMove(ctx, e): void {
    if (dragErasing) {
      const mapStore = useMapStore()
      const { x, y } = ctx.svgPoint(e)
      const hit = ctx.findLineAt(x, y)
      if (hit && hit.id !== lastErasedLineId) {
        mapStore.dispatch(new RemoveLineCommand(hit.id))
        lastErasedLineId = hit.id
      }
      return
    }

    const lineStore = useLineStore()
    if (lineStore.pendingAnchor === null) {
      lineStore.previewEnd = null
      return
    }

    const snapStore = useSnapStore()
    const { x: rawX, y: rawY } = ctx.svgPoint(e)
    lineStore.previewEnd = snapPoint(rawX, rawY, snapStore.snapMode, HEX_SIZE)
  },

  onPointerUp(_ctx, _e): void {
    if (dragErasing) {
      const mapStore = useMapStore()
      mapStore.endStroke()
      dragErasing = false
      lastErasedLineId = null
    }
  },

  onPointerCancel(_ctx): void {
    if (dragErasing) {
      const mapStore = useMapStore()
      mapStore.endStroke()
      dragErasing = false
      lastErasedLineId = null
    }
  },

  isDragging(): boolean {
    return dragErasing
  },
}
