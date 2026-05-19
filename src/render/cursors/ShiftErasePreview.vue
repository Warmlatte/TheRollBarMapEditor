<script setup lang="ts">
import { useBrushStore } from '../../stores/brushStore'

defineProps<{
  cursorX: number
  cursorY: number
  shiftHeld: boolean
  anyDragging: boolean
}>()

const brushStore = useBrushStore()
</script>

<template>
  <circle
    v-if="shiftHeld && anyDragging && brushStore.tool !== 'erase'"
    :cx="cursorX"
    :cy="cursorY"
    r="5"
    fill="rgba(255,60,60,0.18)"
    stroke="#ff5050"
    stroke-width="1.5"
    pointer-events="none"
  />
</template>
