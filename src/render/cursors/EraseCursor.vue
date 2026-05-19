<script setup lang="ts">
import { useBrushStore } from '../../stores/brushStore'
import { useEraseStore } from '../../stores/eraseStore'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()
const eraseStore = useEraseStore()
</script>

<template>
  <g v-if="brushStore.tool === 'erase'" :transform="`translate(${cursorX}, ${cursorY})`">
    <circle
      :r="eraseStore.radius"
      fill="rgba(255,60,60,0.18)"
      stroke="#ff5050"
      stroke-width="1.5"
    />
  </g>
</template>
