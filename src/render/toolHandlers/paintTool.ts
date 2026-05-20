import { useMapStore } from '../../stores/mapStore'
import { useBrushStore } from '../../stores/brushStore'
import { useColorPickerStore } from '../../stores/colorPickerStore'
import { PaintHexCommand } from '../../commands/hexCommands'
import { hexDistance } from '../../lib/hexMath'
import type { ToolHandler, ToolContext } from './types'

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

  onPointerCancel(_ctx) {
    if (isStrokeActive) {
      const mapStore = useMapStore()
      mapStore.endStroke()
      isStrokeActive = false
      strokePainted.clear()
    }
  },

  isDragging() {
    return isStrokeActive
  },

  onEyedrop(ctx: ToolContext, e: MouseEvent) {
    const { x, y } = ctx.svgPoint(e as PointerEvent)
    const { q, r } = ctx.pixelToHex(x, y)
    const painted = ctx.mapData.hexes.find(h => h.q === q && h.r === r)
    if (!painted) return
    useColorPickerStore().applyHex(painted.color)
    useBrushStore().setColor(painted.color)
  },
}

export function _resetPaintToolForTest(): void {
  isStrokeActive = false
  strokePainted.clear()
}
