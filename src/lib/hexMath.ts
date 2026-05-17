const SQRT3 = Math.sqrt(3)

export const HEX_SIZE = 40

export function hexToPixel(q: number, r: number, size = HEX_SIZE): { x: number; y: number } {
  return {
    x: size * SQRT3 * (q + r / 2),
    y: size * 1.5 * r,
  }
}

export function pixelToHex(x: number, y: number, size = HEX_SIZE): { q: number; r: number } {
  const rawQ = (x * SQRT3 / 3 - y / 3) / size
  const rawR = (y * 2 / 3) / size
  return roundHex(rawQ, rawR)
}

function roundHex(q: number, r: number): { q: number; r: number } {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  let rs = Math.round(s)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) {
    rq = -rr - rs
  } else if (dr > ds) {
    rr = -rq - rs
  }
  return { q: rq, r: rr }
}

export function hexCorners(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90)
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
}

export function hexDistance(
  a: { q: number; r: number },
  b: { q: number; r: number },
): number {
  return (
    Math.abs(a.q - b.q) +
    Math.abs(a.q + a.r - b.q - b.r) +
    Math.abs(a.r - b.r)
  ) / 2
}
