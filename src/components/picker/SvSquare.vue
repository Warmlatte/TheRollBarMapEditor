<template>
  <div
    class="sv-square"
    :style="{ background: hueColor }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <div class="sv-white-overlay" />
    <div class="sv-black-overlay" />
    <div
      class="sv-cursor"
      :style="{
        left: `${colorPicker.s * 100}%`,
        top: `${(1 - colorPicker.v) * 100}%`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useColorPickerStore } from '../../stores/colorPickerStore'

const colorPicker = useColorPickerStore()

const hueColor = computed(() => {
  const h = colorPicker.h
  const r = (n: number) => {
    const k = (n + h / 60) % 6
    return Math.round((1 - Math.max(0, Math.min(k, 4 - k, 1))) * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${r(5)}${r(3)}${r(1)}`
})

let isDragging = false

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function updateFromPointer(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const s = clamp(x / rect.width, 0, 1)
  const v = clamp(1 - y / rect.height, 0, 1)
  colorPicker.setHsv(colorPicker.h, s, v)
}

function onPointerDown(e: PointerEvent) {
  isDragging = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updateFromPointer(e)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return
  updateFromPointer(e)
}

function onPointerUp() {
  isDragging = false
}
</script>

<style scoped>
.sv-square {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  cursor: crosshair;
  border-radius: 4px;
  border: 1px solid #555;
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.sv-white-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, white, transparent);
  pointer-events: none;
}

.sv-black-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, black);
  pointer-events: none;
}

.sv-cursor {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
