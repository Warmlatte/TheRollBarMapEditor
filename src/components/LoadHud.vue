<template>
  <div
    class="hud-panel map-list-panel absolute left-3 top-[56px] z-[11]"
    style="width: 420px; max-width: calc(100vw - 24px); max-height: calc(100vh - 80px); padding: 0;"
  >
    <div class="map-list-header">
      <span>目前地圖</span>
      <span>{{ sessionStore.sessions.length }}</span>
    </div>

    <div class="map-list-scroll">
      <button
        v-for="(session, idx) in sessionStore.sessions"
        :key="session.id"
        data-testid="map-preview-card"
        class="map-preview-card"
        :class="{
          'is-active': session.id === sessionStore.activeId,
          'is-dragging': dragIdx === idx,
          'is-drag-over': overIdx === idx,
        }"
        draggable="true"
        @click="sessionStore.setActive(session.id)"
        @dragstart="onDragStart(idx)"
        @dragover="onDragOver($event, idx)"
        @drop="onDrop(idx)"
        @dragend="onDragEnd"
      >
        <svg class="map-preview-thumb" viewBox="-58 -52 116 104" aria-hidden="true">
          <polygon
            v-for="hex in previewTiles(session.mapData)"
            :key="hex.key"
            :points="hex.points"
            :fill="hex.color"
            stroke="rgba(232, 220, 196, 0.48)"
            stroke-width="1.2"
          />
        </svg>
        <span class="map-preview-meta">
          <span class="map-preview-name">{{ session.name }}</span>
          <span class="map-preview-count">{{ session.mapData.hexes.length }} 色塊</span>
        </span>
      </button>

      <p v-if="sessionStore.sessions.length === 0" class="empty-hint">尚無開啟地圖</p>
    </div>

    <div class="map-upload-zone">
      <button
        data-testid="map-upload-button"
        class="map-upload-button"
        type="button"
        @click="uploadMap"
      >
        <span class="upload-icon">↑</span>
        <span>
          <span class="upload-title">上傳檔案</span>
          <span class="upload-subtitle">開啟 .TRBM 地圖</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from '../stores/sessionStore'
import { useToastStore } from '../stores/toastStore'
import { getStorageAdapter } from '../storage/adapter'
import { hexCorners, hexesInRadius, hexToPixel } from '../lib/hexMath'
import type { MapData } from '../data/types'

const sessionStore = useSessionStore()
const toastStore = useToastStore()
const previewSize = 10
const dragIdx = ref<number | null>(null)
const overIdx = ref<number | null>(null)

type PreviewTile = {
  key: string
  points: string
  color: string
}

function previewTiles(mapData: MapData): PreviewTile[] {
  const paintedByCoord = new Map(
    mapData.hexes.map((hex) => [`${hex.q},${hex.r}`, hex.color]),
  )
  const hexes = hexesInRadius(mapData.bounds.radius)
  const centers = hexes.map((hex) => ({
    ...hex,
    ...hexToPixel(hex.q, hex.r, previewSize),
  }))
  const minX = Math.min(...centers.map((hex) => hex.x))
  const maxX = Math.max(...centers.map((hex) => hex.x))
  const minY = Math.min(...centers.map((hex) => hex.y))
  const maxY = Math.max(...centers.map((hex) => hex.y))
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const contentWidth = maxX - minX + previewSize * 2
  const contentHeight = maxY - minY + previewSize * 2
  const scale = Math.min(104 / contentWidth, 92 / contentHeight)
  const tileSize = previewSize * scale

  return centers.map((hex) => ({
    key: `${hex.q},${hex.r}`,
    points: previewHexPoints((hex.x - centerX) * scale, (hex.y - centerY) * scale, tileSize),
    color: paintedByCoord.get(`${hex.q},${hex.r}`) ?? 'rgba(255, 255, 255, 0.035)',
  }))
}

function previewHexPoints(x: number, y: number, size: number): string {
  return hexCorners(x, y, size)
}

function onDragStart(idx: number): void {
  dragIdx.value = idx
}

function onDragOver(event: DragEvent, idx: number): void {
  event.preventDefault()
  overIdx.value = idx
}

function onDrop(idx: number): void {
  if (dragIdx.value !== null && dragIdx.value !== idx) {
    const reordered = sessionStore.sessions.slice()
    const [moved] = reordered.splice(dragIdx.value, 1)
    if (moved) {
      reordered.splice(idx, 0, moved)
      sessionStore.sessions = reordered
    }
  }
  dragIdx.value = null
  overIdx.value = null
}

function onDragEnd(): void {
  dragIdx.value = null
  overIdx.value = null
}

async function uploadMap(): Promise<void> {
  try {
    const result = await getStorageAdapter().openMap()
    if (!result) return
    await sessionStore.createSessionFromFile(result.mapFile, result.handle ?? result.mapFile.name)
  } catch {
    toastStore.pushToast('地圖檔案載入失敗，請確認檔案格式', 'error', 0)
  }
}
</script>

<style scoped>
.map-list-panel {
  position: absolute;
  top: 56px;
  left: 12px;
  z-index: 11;
  display: flex;
  width: min(420px, calc(100vw - 24px));
  max-height: min(520px, calc(100vh - 80px));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 0 8px 8px;
  background: rgba(0, 0, 0, 0.78);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0;
}

.map-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  color: #e8dcc4;
  font-size: 12px;
  font-weight: 700;
}

.map-list-scroll {
  display: grid;
  gap: 8px;
  overflow-y: auto;
  padding: 0 10px 10px;
}

.map-preview-card {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 78px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #d6d0c5;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}

.map-preview-card:hover {
  border-color: rgba(232, 220, 196, 0.28);
  background: rgba(255, 255, 255, 0.07);
}

.map-preview-card.is-active {
  border-color: rgba(106, 154, 82, 0.68);
  background: rgba(74, 110, 58, 0.22);
}

.map-preview-card.is-dragging {
  opacity: 0.45;
}

.map-preview-card.is-drag-over {
  border-color: rgba(232, 220, 196, 0.64);
}

.map-preview-thumb {
  width: 72px;
  height: 60px;
  border-radius: 4px;
  background: #171717;
}

.map-preview-meta,
.map-preview-name,
.map-preview-count {
  display: block;
  min-width: 0;
}

.map-preview-name {
  overflow: hidden;
  color: #f0eadf;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-preview-count {
  margin-top: 4px;
  color: #817b72;
  font-size: 11px;
}

.empty-hint {
  margin: 10px 0;
  color: #777;
  font-size: 12px;
  text-align: center;
}

.map-upload-zone {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px;
}

.map-upload-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 58px;
  padding: 10px;
  border: 1px dashed rgba(232, 220, 196, 0.32);
  border-radius: 6px;
  background: rgba(232, 220, 196, 0.04);
  color: #e8dcc4;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}

.map-upload-button:hover {
  border-color: rgba(232, 220, 196, 0.58);
  background: rgba(232, 220, 196, 0.08);
}

.upload-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(232, 220, 196, 0.12);
  font-size: 16px;
  font-weight: 700;
}

.upload-title,
.upload-subtitle {
  display: block;
}

.upload-title {
  font-size: 13px;
  font-weight: 700;
}

.upload-subtitle {
  margin-top: 2px;
  color: #8f897d;
  font-size: 11px;
}
</style>
