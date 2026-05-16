<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBrushStore } from '../../stores/brushStore'
import { useEraseStore } from '../../stores/eraseStore'
import { HEX_SIZE } from '../../lib/hexMath'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()
const eraseStore = useEraseStore()

const shiftPressed = ref(false)

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Shift') shiftPressed.value = true
}
function onKeyUp(e: KeyboardEvent) {
  if (e.key === 'Shift') shiftPressed.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <g v-if="brushStore.tool === 'erase' && shiftPressed">
    <circle
      :cx="cursorX"
      :cy="cursorY"
      :r="eraseStore.eraseRadius * 2 * HEX_SIZE"
      fill="rgba(239,68,68,0.08)"
      stroke="#ef4444"
      stroke-width="1"
      stroke-dasharray="6 3"
    />
  </g>
</template>
