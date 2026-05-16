import type { MapData } from '../data/types'

// Renders MapData to a clean SVG string for export and thumbnails.
// Full implementation pending persistence-storage change.
export function exportRender(_mapData: MapData): string {
  return '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
}
