<script setup lang="ts">
import { computed } from 'vue'
import { useBrushStore } from '../../stores/brushStore'
import { useDoodleStore } from '../../stores/doodleStore'

const props = defineProps<{ cursorX: number; cursorY: number; shiftHeld: boolean }>()

const brushStore = useBrushStore()
const doodleStore = useDoodleStore()

const circleRadius = computed(() => Math.max(doodleStore.width / 2, 4))
</script>

<template>
  <g
    v-if="brushStore.tool === 'doodle' && !shiftHeld"
    :transform="`translate(${props.cursorX}, ${props.cursorY})`"
  >
    <circle
      :r="circleRadius"
      :fill="brushStore.currentColor"
      :fill-opacity="doodleStore.opacity"
      stroke="#fff"
      stroke-width="1"
    />
  </g>
</template>
