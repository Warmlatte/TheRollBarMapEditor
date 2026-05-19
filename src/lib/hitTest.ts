import type { Hex, Icon, Line, Doodle } from '../data/types'
import { pixelToHex, hexDistance, HEX_SIZE } from './hexMath'

export function findHexAt(hexes: Hex[], x: number, y: number): Hex | undefined {
  const { q, r } = pixelToHex(x, y)
  return hexes.find(h => h.q === q && h.r === r)
}

export function findHexesInRadius(
  hexes: Hex[],
  x: number,
  y: number,
  radius: number,
): Hex[] {
  const center = pixelToHex(x, y)
  return hexes.filter(h => hexDistance(h, center) <= radius)
}

export function findIconAt(icons: Icon[], x: number, y: number): Icon | undefined {
  for (let i = icons.length - 1; i >= 0; i--) {
    const icon = icons[i]!
    const dist = Math.sqrt((icon.x - x) ** 2 + (icon.y - y) ** 2)
    if (dist <= HEX_SIZE) return icon
  }
  return undefined
}

export function findLineAt(lines: Line[], x: number, y: number): Line | undefined {
  return lines.find(line => distToSegment(x, y, line) < 10)
}

export function findDoodleAt(doodles: Doodle[], x: number, y: number): Doodle | undefined {
  return doodles.find(doodle =>
    doodle.points.some(p => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < 10),
  )
}

function distToSegment(px: number, py: number, line: Line): number {
  const dx = line.x2 - line.x1
  const dy = line.y2 - line.y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) {
    return Math.sqrt((px - line.x1) ** 2 + (py - line.y1) ** 2)
  }
  const t = Math.max(0, Math.min(1, ((px - line.x1) * dx + (py - line.y1) * dy) / len2))
  return Math.sqrt((px - line.x1 - t * dx) ** 2 + (py - line.y1 - t * dy) ** 2)
}
