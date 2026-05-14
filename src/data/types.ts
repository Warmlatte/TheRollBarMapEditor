export type Hex = { q: number; r: number; color: string }

export type Bounds = { radius: number }

export type Brush = { color: string }

export type Icon = {
  id: string
  q: number
  r: number
  svgId: string
  size: number
  rotation: number
  color: string
}

export type Line = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  dashed: boolean
  color: string
}

export type Doodle = {
  id: string
  points: Array<{ x: number; y: number }>
  width: number
  opacity: number
  color: string
}

export type MapData = {
  name: string
  bounds: Bounds
  hexes: Hex[]
  icons: Icon[]
  lines: Line[]
  doodles: Doodle[]
}

export type MapFile = { version: 1 } & MapData
