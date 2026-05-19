<script setup lang="ts">
import { useBrushStore } from '../../stores/brushStore'

defineProps<{ cursorX: number; cursorY: number; shiftHeld: boolean }>()

const brushStore = useBrushStore()
</script>

<template>
  <g
    v-if="brushStore.tool === 'paint' && !shiftHeld"
    :transform="`translate(${cursorX}, ${cursorY})`"
  >
    <circle
      r="6"
      :fill="brushStore.currentColor"
      stroke="#fff"
      stroke-width="1"
      opacity="0.85"
      pointer-events="none"
    />
  </g>
</template>
