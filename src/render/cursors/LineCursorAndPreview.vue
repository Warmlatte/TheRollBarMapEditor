<script setup lang="ts">
import { useBrushStore } from '../../stores/brushStore'
import { useLineStore } from '../../stores/lineStore'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()
const lineStore = useLineStore()
</script>

<template>
  <g v-if="brushStore.tool === 'line'">
    <circle
      v-if="lineStore.pendingAnchor"
      :cx="lineStore.pendingAnchor.x"
      :cy="lineStore.pendingAnchor.y"
      r="4"
      fill="#6366f1"
      stroke="white"
      stroke-width="1.5"
    />
    <line
      v-if="lineStore.pendingAnchor && lineStore.previewEnd"
      :x1="lineStore.pendingAnchor.x"
      :y1="lineStore.pendingAnchor.y"
      :x2="lineStore.previewEnd.x"
      :y2="lineStore.previewEnd.y"
      stroke="#6366f1"
      :stroke-width="lineStore.lineWidth"
      stroke-dasharray="6 3"
      stroke-linecap="round"
      opacity="0.7"
    />
    <g :transform="`translate(${cursorX}, ${cursorY})`">
      <circle r="4" fill="none" stroke="#6366f1" stroke-width="1.5" />
      <line x1="-8" y1="0" x2="8" y2="0" stroke="#6366f1" stroke-width="1" />
      <line x1="0" y1="-8" x2="0" y2="8" stroke="#6366f1" stroke-width="1" />
    </g>
  </g>
</template>
