import type { Hex, Icon, Line, Doodle, Bounds, MapFile } from './types'

const COLOR_RE = /^#[0-9a-f]{6}$/

function assertString(val: unknown, field: string): asserts val is string {
  if (typeof val !== 'string') throw new Error(`${field}: expected string`)
}

function assertNumber(val: unknown, field: string): asserts val is number {
  if (typeof val !== 'number') throw new Error(`${field}: expected number`)
}

function assertBoolean(val: unknown, field: string): asserts val is boolean {
  if (typeof val !== 'boolean') throw new Error(`${field}: expected boolean`)
}

function assertColor(val: unknown, field: string): asserts val is string {
  assertString(val, field)
  if (!COLOR_RE.test(val)) throw new Error(`${field}: invalid color format (expected #rrggbb lowercase hex)`)
}

function assertArray(val: unknown, field: string): asserts val is unknown[] {
  if (!Array.isArray(val)) throw new Error(`${field}: expected array`)
}

function assertObject(val: unknown, field: string): asserts val is Record<string, unknown> {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error(`${field}: expected object`)
  }
}

function validateHex(val: unknown, index: number): Hex {
  assertObject(val, `hexes[${index}]`)
  assertNumber(val.q, `hexes[${index}].q`)
  assertNumber(val.r, `hexes[${index}].r`)
  assertColor(val.color, `hexes[${index}].color`)
  return { q: val.q, r: val.r, color: val.color }
}

function validateIcon(val: unknown, index: number): Icon {
  assertObject(val, `icons[${index}]`)
  assertString(val.id, `icons[${index}].id`)
  assertNumber(val.x, `icons[${index}].x`)
  assertNumber(val.y, `icons[${index}].y`)
  assertString(val.svgId, `icons[${index}].svgId`)
  assertNumber(val.size, `icons[${index}].size`)
  assertNumber(val.rotation, `icons[${index}].rotation`)
  assertColor(val.color, `icons[${index}].color`)
  return { id: val.id, x: val.x, y: val.y, svgId: val.svgId, size: val.size, rotation: val.rotation, color: val.color }
}

function validateLine(val: unknown, index: number): Line {
  assertObject(val, `lines[${index}]`)
  assertString(val.id, `lines[${index}].id`)
  assertNumber(val.x1, `lines[${index}].x1`)
  assertNumber(val.y1, `lines[${index}].y1`)
  assertNumber(val.x2, `lines[${index}].x2`)
  assertNumber(val.y2, `lines[${index}].y2`)
  assertNumber(val.width, `lines[${index}].width`)
  assertBoolean(val.dashed, `lines[${index}].dashed`)
  assertColor(val.color, `lines[${index}].color`)
  return { id: val.id, x1: val.x1, y1: val.y1, x2: val.x2, y2: val.y2, width: val.width, dashed: val.dashed, color: val.color }
}

function validateDoodle(val: unknown, index: number): Doodle {
  assertObject(val, `doodles[${index}]`)
  assertString(val.id, `doodles[${index}].id`)
  assertArray(val.points, `doodles[${index}].points`)
  assertNumber(val.width, `doodles[${index}].width`)
  assertNumber(val.opacity, `doodles[${index}].opacity`)
  assertColor(val.color, `doodles[${index}].color`)
  const points = val.points.map((p: unknown, i: number) => {
    assertObject(p, `doodles[${index}].points[${i}]`)
    assertNumber(p.x, `doodles[${index}].points[${i}].x`)
    assertNumber(p.y, `doodles[${index}].points[${i}].y`)
    return { x: p.x, y: p.y }
  })
  return { id: val.id, points, width: val.width, opacity: val.opacity, color: val.color }
}

function validateBounds(val: unknown): Bounds {
  assertObject(val, 'bounds')
  assertNumber(val.radius, 'bounds.radius')
  return { radius: val.radius }
}

export function validateMapFile(data: unknown): MapFile {
  assertObject(data, 'root')

  if (!('version' in data)) throw new Error('Missing field: version')
  if (data.version !== 1) throw new Error(`version: unsupported version ${String(data.version)}`)

  assertString(data.name, 'name')

  if (!('bounds' in data)) throw new Error('Missing field: bounds')
  const bounds = validateBounds(data.bounds)

  if (!('hexes' in data)) throw new Error('Missing field: hexes')
  assertArray(data.hexes, 'hexes')
  const hexes = data.hexes.map(validateHex)

  if (!('icons' in data)) throw new Error('Missing field: icons')
  assertArray(data.icons, 'icons')
  const icons = data.icons.map(validateIcon)

  if (!('lines' in data)) throw new Error('Missing field: lines')
  assertArray(data.lines, 'lines')
  const lines = data.lines.map(validateLine)

  if (!('doodles' in data)) throw new Error('Missing field: doodles')
  assertArray(data.doodles, 'doodles')
  const doodles = data.doodles.map(validateDoodle)

  return { version: 1, name: data.name, bounds, hexes, icons, lines, doodles }
}
