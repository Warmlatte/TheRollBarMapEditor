import { useMapStore } from '../../stores/mapStore'
import { useIconStore } from '../../stores/iconStore'
import { useBrushStore } from '../../stores/brushStore'
import { useSnapStore } from '../../stores/snapStore'
import { PlaceIconCommand, RemoveIconCommand } from '../../commands/iconCommands'
import { snapPoint } from '../../lib/snap'
import { hexDistance, HEX_SIZE } from '../../lib/hexMath'
import type { ToolContext, ToolHandler } from './types'

let dragErasing = false
let lastErasedIconId: string | null = null

export function _resetIconToolForTest(): void {
  dragErasing = false
  lastErasedIconId = null
}

export const iconHandler: ToolHandler = {
  onPointerDown(ctx, e) {
    const mapStore = useMapStore()
    const iconStore = useIconStore()
    const snapStore = useSnapStore()

    const { x: rawX, y: rawY } = ctx.svgPoint(e)

    if (e.shiftKey) {
      if (e.button !== 0) return
      dragErasing = true
      lastErasedIconId = null
      mapStore.beginStroke()
      ctx.tryCapture(e.pointerId)
      const hit = ctx.findIconAt(rawX, rawY)
      if (hit) {
        mapStore.dispatch(new RemoveIconCommand(hit.id))
        lastErasedIconId = hit.id
      }
      return
    }

    if (!iconStore.selectedSvgId) return

    const snap = snapPoint(rawX, rawY, snapStore.snapMode, HEX_SIZE)
    const { q, r } = ctx.pixelToHex(snap.x, snap.y)
    if (hexDistance({ q, r }, { q: 0, r: 0 }) > ctx.mapData.bounds.radius) return

    mapStore.dispatch(new PlaceIconCommand({
      id: ctx.newId(),
      x: snap.x,
      y: snap.y,
      svgId: iconStore.selectedSvgId,
      size: iconStore.size,
      rotation: iconStore.rotation,
      color: iconStore.color,
    }))
  },

  onPointerMove(ctx, e) {
    if (!dragErasing) return
    const mapStore = useMapStore()
    const { x, y } = ctx.svgPoint(e)
    const hit = ctx.findIconAt(x, y)
    if (hit && hit.id !== lastErasedIconId) {
      mapStore.dispatch(new RemoveIconCommand(hit.id))
      lastErasedIconId = hit.id
    }
  },

  onPointerUp(ctx, e) {
    if (!dragErasing) return
    const mapStore = useMapStore()
    mapStore.endStroke()
    ctx.tryRelease(e.pointerId)
    dragErasing = false
    lastErasedIconId = null
  },

  onPointerCancel(ctx, e) {
    if (!dragErasing) return
    const mapStore = useMapStore()
    mapStore.endStroke()
    ctx.tryRelease(e.pointerId)
    dragErasing = false
    lastErasedIconId = null
  },

  isDragging(): boolean {
    return dragErasing
  },

  onEyedrop(ctx: ToolContext, e: MouseEvent): void {
    const { x, y } = ctx.svgPointFromMouse?.(e) ?? { x: e.clientX, y: e.clientY }
    const hit = ctx.findIconAt(x, y)
    if (!hit) return
    const iconStore = useIconStore()
    const brushStore = useBrushStore()
    iconStore.setSelectedSvgId(hit.svgId)
    iconStore.setSize(hit.size)
    iconStore.setRotation(hit.rotation)
    brushStore.setColor(hit.color)
  },
}
