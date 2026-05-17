import { useMapStore } from '../../stores/mapStore'
import { useIconStore } from '../../stores/iconStore'
import { PlaceIconCommand, RemoveIconCommand } from '../../commands/iconCommands'
import type { ToolHandler } from './types'

export const iconHandler: ToolHandler = {
  onPointerDown(ctx, e) {
    const mapStore = useMapStore()
    const iconStore = useIconStore()

    const { x, y } = ctx.svgPoint(e)
    const existingIcon = ctx.findIconAt(x, y)

    if (existingIcon) {
      mapStore.dispatch(new RemoveIconCommand(existingIcon.id))
      return
    }

    if (!iconStore.selectedSvgId) return

    const { q, r } = ctx.pixelToHex(x, y)
    mapStore.dispatch(new PlaceIconCommand({
      id: ctx.newId(),
      q,
      r,
      svgId: iconStore.selectedSvgId,
      size: iconStore.size,
      rotation: iconStore.rotation,
      color: iconStore.color,
    }))
  },

  onPointerMove(_ctx, _e) {},

  onPointerUp(_ctx, _e) {},
}
