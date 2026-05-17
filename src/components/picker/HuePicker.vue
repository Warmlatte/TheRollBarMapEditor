<template>
  <div
    class="hue-picker"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <div
      class="hue-cursor"
      :style="{ left: `${(colorPicker.h / 360) * 100}%` }"
    />
  </div>
</template>

<script setup lang="ts">
import { useColorPickerStore } from '../../stores/colorPickerStore'

const colorPicker = useColorPickerStore()

let isDragging = false

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function updateFromPointer(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const h = clamp((x / rect.width) * 360, 0, 360)
  colorPicker.setHsv(h, colorPicker.s, colorPicker.v)
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
.hue-picker {
  position: relative;
  width: 100%;
  height: 14px;
  border-radius: 7px;
  border: 1px solid #555;
  background: linear-gradient(
    to right,
    hsl(0, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(360, 100%, 50%)
  );
  cursor: pointer;
  user-select: none;
  touch-action: none;
}

.hue-cursor {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
