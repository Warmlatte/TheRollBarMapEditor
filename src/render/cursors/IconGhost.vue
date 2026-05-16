<script setup lang="ts">
import { useBrushStore } from '../../stores/brushStore'
import { useIconStore } from '../../stores/iconStore'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()
const iconStore = useIconStore()
</script>

<template>
  <g
    v-if="brushStore.tool === 'icon'"
    :transform="`translate(${cursorX}, ${cursorY}) scale(${iconStore.iconSize}) rotate(${iconStore.iconRotation})`"
    opacity="0.5"
  >
    <g v-if="iconStore.selectedSvg" v-html="iconStore.selectedSvg" />
    <g v-else>
      <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" stroke-width="2" />
      <line x1="0" y1="-12" x2="0" y2="12" stroke="currentColor" stroke-width="2" />
    </g>
  </g>
</template>
