import type { ToolContext, ToolHandler } from './toolHandlers/types'

export function buildSvgPoint(
  svgEl: SVGSVGElement,
): (e: PointerEvent) => { x: number; y: number } {
  return function svgPoint(e: PointerEvent): { x: number; y: number } {
    const ctm = svgEl.getScreenCTM()
    if (ctm !== null) {
      const pt = svgEl.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const { x, y } = pt.matrixTransform(ctm.inverse())
      return { x, y }
    }
    // fallback when CTM is unavailable
    const rect = svgEl.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
}

export function handlePointerDown(
  e: PointerEvent,
  svgEl: SVGSVGElement,
  handler: ToolHandler,
  buildCtx: (e: PointerEvent) => ToolContext,
): void {
  if (e.button !== 0) return
  svgEl.setPointerCapture(e.pointerId)
  const ctx = buildCtx(e)
  handler.onPointerDown(ctx, e)
}

export function handlePointerMove(
  e: PointerEvent,
  handler: ToolHandler,
  buildCtx: (e: PointerEvent) => ToolContext,
): void {
  const ctx = buildCtx(e)
  handler.onPointerMove(ctx, e)
}

export function handlePointerUp(
  e: PointerEvent,
  handler: ToolHandler,
  buildCtx: (e: PointerEvent) => ToolContext,
): void {
  const ctx = buildCtx(e)
  handler.onPointerUp(ctx, e)
}
