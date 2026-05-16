import { useMapStore } from '../../stores/mapStore'
import { useBrushStore } from '../../stores/brushStore'
import { PaintHexCommand } from '../../commands/hexCommands'
import { hexDistance } from '../../lib/hexMath'
import type { ToolHandler } from './types'

const strokePainted = new Set<string>()
let isStrokeActive = false

export const paintHandler: ToolHandler = {
  onPointerDown(ctx, e) {
    const mapStore = useMapStore()
    const brushStore = useBrushStore()

    mapStore.beginStroke()
    isStrokeActive = true

    const { x, y } = ctx.svgPoint(e)
    const { q, r } = ctx.pixelToHex(x, y)

    if (hexDistance({ q, r }, { q: 0, r: 0 }) <= ctx.mapData.bounds.radius) {
      mapStore.dispatch(new PaintHexCommand({ q, r }, brushStore.color))
      strokePainted.add(`${q},${r}`)
    }
  },

  onPointerMove(ctx, e) {
    if (!isStrokeActive) return

    const mapStore = useMapStore()
    const brushStore = useBrushStore()

    const { x, y } = ctx.svgPoint(e)
    const { q, r } = ctx.pixelToHex(x, y)

    const key = `${q},${r}`
    if (
      hexDistance({ q, r }, { q: 0, r: 0 }) <= ctx.mapData.bounds.radius &&
      !strokePainted.has(key)
    ) {
      mapStore.dispatch(new PaintHexCommand({ q, r }, brushStore.color))
      strokePainted.add(key)
    }
  },

  onPointerUp(_ctx, _e) {
    const mapStore = useMapStore()
    mapStore.endStroke()
    isStrokeActive = false
    strokePainted.clear()
  },
}
