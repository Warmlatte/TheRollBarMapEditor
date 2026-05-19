<script setup lang="ts">
import { ref, computed, toRaw, onMounted } from 'vue'
import { useMapStore } from '../stores/mapStore'
import { useBrushStore } from '../stores/brushStore'
import { useViewportStore } from '../stores/viewportStore'
import { getHandler } from '../tools/registry'
import { buildSvgPoint, handlePointerDown, handlePointerMove, handlePointerUp } from './pointerHandlers'
import { hexToPixel, pixelToHex, HEX_SIZE, hexDistance } from '../lib/hexMath'
import { findHexAt, findHexesInRadius, findIconAt, findLineAt, findDoodleAt } from '../lib/hitTest'
import type { ToolContext } from './toolHandlers/types'
import PaintCursor from './cursors/PaintCursor.vue'
import EraseCursor from './cursors/EraseCursor.vue'
import DoodleCursor from './cursors/DoodleCursor.vue'
import IconGhost from './cursors/IconGhost.vue'
import LineCursorAndPreview from './cursors/LineCursorAndPreview.vue'
import ShiftErasePreview from './cursors/ShiftErasePreview.vue'
import { useIconLibraryStore, getDisplaySvg } from '../stores/iconLibraryStore'

const mapStore = useMapStore()
const brushStore = useBrushStore()
const viewportStore = useViewportStore()
const iconLibraryStore = useIconLibraryStore()

const svgEl = ref<SVGSVGElement | null>(null)
const cursorX = ref(0)
const cursorY = ref(0)

const mapData = computed(() => mapStore.mapData)

const viewBoxStr = computed(() => {
  const { panX, panY, zoom } = viewportStore
  const el = svgEl.value
  const w = el ? el.clientWidth / zoom : 800 / zoom
  const h = el ? el.clientHeight / zoom : 600 / zoom
  return `${panX} ${panY} ${w} ${h}`
})

const allHexPositions = computed(() => {
  const { radius } = mapData.value.bounds
  const positions: Array<{ q: number; r: number }> = []
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (hexDistance({ q, r }, { q: 0, r: 0 }) <= radius) {
        positions.push({ q, r })
      }
    }
  }
  return positions
})

function hexPolygonPoints(q: number, r: number): string {
  const { x: cx, y: cy } = hexToPixel(q, r)
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    const px = cx + HEX_SIZE * Math.cos(angle)
    const py = cy + HEX_SIZE * Math.sin(angle)
    points.push(`${px},${py}`)
  }
  return points.join(' ')
}

function iconSvg(svgId: string): string {
  const entry = iconLibraryStore.icons.find((icon) => icon.id === svgId)
  return entry ? getDisplaySvg(entry.rawSvg) : ''
}

function buildContext(_e: PointerEvent): ToolContext {
  const svg = svgEl.value!
  const svgPointFn = buildSvgPoint(svg)
  const rawMap = toRaw(mapStore.mapData)

  return {
    svgPoint: svgPointFn,
    pixelToHex: (x, y) => pixelToHex(x, y),
    hexToPixel: (q, r) => hexToPixel(q, r),
    findHexAt: (x, y) => findHexAt(rawMap.hexes, x, y),
    findHexesInRadius: (x, y, r) => findHexesInRadius(rawMap.hexes, x, y, r),
    findIconAt: (x, y) => findIconAt(rawMap.icons, x, y),
    findLineAt: (x, y) => findLineAt(rawMap.lines, x, y),
    findDoodleAt: (x, y) => findDoodleAt(rawMap.doodles, x, y),
    newId: () => crypto.randomUUID(),
    mapData: rawMap,
  }
}

onMounted(() => {
  const el = svgEl.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  const initialZoom = 0.5
  viewportStore.setZoom(initialZoom)
  viewportStore.setPan(-w / (2 * initialZoom), -h / (2 * initialZoom))
})

function onPointerDown(e: PointerEvent) {
  if (!svgEl.value) return
  handlePointerDown(e, svgEl.value, getHandler(brushStore.tool), buildContext)
}

function onPointerMove(e: PointerEvent) {
  if (svgEl.value) {
    const pos = buildSvgPoint(svgEl.value)(e)
    cursorX.value = pos.x
    cursorY.value = pos.y
  }
  handlePointerMove(e, getHandler(brushStore.tool), buildContext)
}

function onPointerUp(e: PointerEvent) {
  handlePointerUp(e, getHandler(brushStore.tool), buildContext)
}
</script>

<template>
  <svg
    ref="svgEl"
    :viewBox="viewBoxStr"
    style="cursor: none; width: 100%; height: 100%; display: block"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <!-- layer 1: grid outlines -->
    <g id="layer-grid">
      <polygon
        v-for="hex in allHexPositions"
        :key="`${hex.q},${hex.r}`"
        :points="hexPolygonPoints(hex.q, hex.r)"
        fill="rgba(255,255,255,0.02)"
        stroke="#444"
        stroke-width="1"
      />
    </g>

    <!-- layer 2: painted hexes -->
    <g id="layer-hexes">
      <polygon
        v-for="hex in mapData.hexes"
        :key="`${hex.q},${hex.r}`"
        :points="hexPolygonPoints(hex.q, hex.r)"
        :fill="hex.color"
        stroke="#222"
        stroke-width="1"
      />
    </g>

    <!-- layer 3: lines -->
    <g id="layer-lines">
      <line
        v-for="l in mapData.lines"
        :key="l.id"
        :x1="l.x1"
        :y1="l.y1"
        :x2="l.x2"
        :y2="l.y2"
        :stroke="l.color"
        :stroke-width="l.width"
        :stroke-dasharray="l.dashed ? '8 4' : undefined"
        stroke-linecap="round"
      />
    </g>

    <!-- layer 4: icons -->
    <g id="layer-icons">
      <g
        v-for="icon in mapData.icons"
        :key="icon.id"
        :data-testid="`placed-icon-${icon.id}`"
        :transform="`translate(${icon.x}, ${icon.y}) rotate(${icon.rotation}) scale(${icon.size / 100}) translate(-50,-50)`"
        :fill="icon.color"
        :stroke="icon.color"
        v-html="iconSvg(icon.svgId)"
      />
    </g>

    <!-- layer 5: doodles -->
    <g id="layer-doodles">
      <polyline
        v-for="d in mapData.doodles"
        :key="d.id"
        :points="d.points.map(p => `${p.x},${p.y}`).join(' ')"
        :stroke="d.color"
        :stroke-width="d.width"
        :stroke-opacity="d.opacity"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>

    <!-- layer 6: tool cursors (each self-determines visibility) -->
    <g id="layer-cursors">
      <PaintCursor :cursor-x="cursorX" :cursor-y="cursorY" />
      <EraseCursor :cursor-x="cursorX" :cursor-y="cursorY" />
      <DoodleCursor :cursor-x="cursorX" :cursor-y="cursorY" />
      <IconGhost :cursor-x="cursorX" :cursor-y="cursorY" />
      <LineCursorAndPreview :cursor-x="cursorX" :cursor-y="cursorY" />
      <ShiftErasePreview :cursor-x="cursorX" :cursor-y="cursorY" />
    </g>
  </svg>
</template>
