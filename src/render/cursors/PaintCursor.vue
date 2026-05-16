<script setup lang="ts">
import { computed } from 'vue'
import { useBrushStore } from '../../stores/brushStore'
import { HEX_SIZE } from '../../lib/hexMath'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()

const hexPoints = computed(() => {
  const size = HEX_SIZE * 0.5
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${size * Math.cos(angle)},${size * Math.sin(angle)}`)
  }
  return pts.join(' ')
})
</script>

<template>
  <g v-if="brushStore.tool === 'paint'" :transform="`translate(${cursorX}, ${cursorY})`">
    <polygon
      :points="hexPoints"
      fill="currentColor"
      fill-opacity="0.3"
      stroke="currentColor"
      stroke-width="1.5"
    />
  </g>
</template>
