<script setup lang="ts">
import { computed } from 'vue'
import { useBrushStore } from '../../stores/brushStore'
import { useLineStore } from '../../stores/lineStore'

const props = defineProps<{ cursorX: number; cursorY: number; shiftHeld: boolean }>()

const brushStore = useBrushStore()
const lineStore = useLineStore()

const cursorR = computed(() => Math.max(lineStore.lineWidth / 2 + 1, 4))
const anchorR = computed(() => Math.max(lineStore.lineWidth / 2 + 1, 3))
const dashArray = computed(() =>
  lineStore.dashed ? `${lineStore.dashLength} ${lineStore.dashGap}` : undefined,
)
</script>

<template>
  <g v-if="brushStore.tool === 'line' && !shiftHeld">
    <circle
      v-if="lineStore.pendingAnchor"
      :cx="lineStore.pendingAnchor.x"
      :cy="lineStore.pendingAnchor.y"
      :r="anchorR"
      :fill="brushStore.currentColor"
      stroke="#fff"
      stroke-width="1"
    />
    <line
      v-if="lineStore.pendingAnchor && lineStore.previewEnd"
      :x1="lineStore.pendingAnchor.x"
      :y1="lineStore.pendingAnchor.y"
      :x2="lineStore.previewEnd.x"
      :y2="lineStore.previewEnd.y"
      :stroke="brushStore.currentColor"
      :stroke-width="lineStore.lineWidth"
      :stroke-dasharray="dashArray"
      stroke-linecap="round"
      opacity="0.5"
    />
    <circle
      :cx="props.cursorX"
      :cy="props.cursorY"
      :r="cursorR"
      :fill="brushStore.currentColor"
      stroke="#fff"
      stroke-width="1"
      opacity="0.85"
      pointer-events="none"
    />
  </g>
</template>
