<script setup lang="ts">
import { useBrushStore } from '../../stores/brushStore'
import { useEraseStore } from '../../stores/eraseStore'
import { HEX_SIZE } from '../../lib/hexMath'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()
const eraseStore = useEraseStore()
</script>

<template>
  <g v-if="brushStore.tool === 'erase'" :transform="`translate(${cursorX}, ${cursorY})`">
    <circle
      :r="eraseStore.eraseRadius * HEX_SIZE"
      fill="rgba(239,68,68,0.1)"
      stroke="#ef4444"
      stroke-width="1.5"
      stroke-dasharray="4 2"
    />
    <circle r="3" fill="#ef4444" />
  </g>
</template>
