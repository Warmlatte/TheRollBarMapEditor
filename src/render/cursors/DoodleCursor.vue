<script setup lang="ts">
import { useBrushStore } from '../../stores/brushStore'
import { useDoodleStore } from '../../stores/doodleStore'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()
const doodleStore = useDoodleStore()
</script>

<template>
  <g v-if="brushStore.tool === 'doodle'" :transform="`translate(${cursorX}, ${cursorY})`">
    <circle
      :r="doodleStore.doodleWidth * 2"
      fill="currentColor"
      fill-opacity="0.5"
      stroke="currentColor"
      stroke-width="1"
    />
  </g>
</template>
