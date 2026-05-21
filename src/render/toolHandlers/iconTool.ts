import { useMapStore } from '../../stores/mapStore'
import { useIconStore } from '../../stores/iconStore'
import { useSnapStore } from '../../stores/snapStore'
import { PlaceIconCommand } from '../../commands/iconCommands'
import { snapPoint } from '../../lib/snap'
import { hexDistance, HEX_SIZE } from '../../lib/hexMath'
import type { ToolHandler } from './types'

export const iconHandler: ToolHandler = {
  onPointerDown(ctx, e) {
    const mapStore = useMapStore()
    const iconStore = useIconStore()
    const snapStore = useSnapStore()

    const { x: rawX, y: rawY } = ctx.svgPoint(e)

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

  onPointerMove(_ctx, _e) {},

  onPointerUp(_ctx, _e) {},

  onPointerCancel(_ctx) {},

  isDragging() { return false },
}
