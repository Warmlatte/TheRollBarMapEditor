import { pixelToHex, hexToPixel } from './hexMath'
import type { SnapMode } from '../stores/snapStore'

export function snapPoint(
  svgX: number,
  svgY: number,
  mode: SnapMode,
  hexSize: number,
): { x: number; y: number } {
  if (mode === 'free') return { x: svgX, y: svgY }

  const { q, r } = pixelToHex(svgX, svgY, hexSize)
  const center = hexToPixel(q, r, hexSize)

  const candidates: { x: number; y: number }[] = [center]

  const corners: { x: number; y: number }[] = []
  for (let i = 0; i < 6; i++) {
    const ang = ((60 * i - 30) * Math.PI) / 180
    const x = center.x + hexSize * Math.cos(ang)
    const y = center.y + hexSize * Math.sin(ang)
    corners.push({ x, y })
    candidates.push({ x, y })
  }

  for (let i = 0; i < 6; i++) {
    const a = corners[i]!
    const b = corners[(i + 1) % 6]!
    candidates.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  }

  let best = candidates[0]!
  let bestDist = (best.x - svgX) ** 2 + (best.y - svgY) ** 2
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i]!
    const d = (c.x - svgX) ** 2 + (c.y - svgY) ** 2
    if (d < bestDist) {
      best = c
      bestDist = d
    }
  }
  return best
}
