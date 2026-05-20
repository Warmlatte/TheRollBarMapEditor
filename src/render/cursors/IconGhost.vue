<script setup lang="ts">
import { computed } from 'vue'
import { useBrushStore } from '../../stores/brushStore'
import { useIconStore } from '../../stores/iconStore'
import { useSnapStore } from '../../stores/snapStore'
import { useIconLibraryStore, getDisplaySvg } from '../../stores/iconLibraryStore'
import { snapPoint } from '../../lib/snap'
import { HEX_SIZE } from '../../lib/hexMath'

const props = defineProps<{ cursorX: number; cursorY: number; shiftHeld: boolean }>()

const brushStore = useBrushStore()
const iconStore = useIconStore()
const snapStore = useSnapStore()
const libStore = useIconLibraryStore()

const snapPos = computed(() =>
  snapPoint(props.cursorX, props.cursorY, snapStore.snapMode, HEX_SIZE),
)

const selectedEntry = computed(() =>
  iconStore.selectedSvgId
    ? libStore.icons.find((e) => e.id === iconStore.selectedSvgId)
    : undefined,
)

const displaySvg = computed(() =>
  selectedEntry.value ? getDisplaySvg(selectedEntry.value.rawSvg) : null,
)
</script>

<template>
  <g
    v-if="brushStore.tool === 'icon' && !shiftHeld"
    :transform="`translate(${snapPos.x}, ${snapPos.y}) rotate(${iconStore.rotation}) scale(${iconStore.size / 100}) translate(-50,-50)`"
    :fill="brushStore.currentColor"
    :stroke="brushStore.currentColor"
    opacity="0.45"
    pointer-events="none"
  >
    <g v-if="displaySvg" v-html="displaySvg" />
    <g v-else>
      <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" stroke-width="2" />
      <line x1="0" y1="-12" x2="0" y2="12" stroke="currentColor" stroke-width="2" />
    </g>
  </g>
  <circle
    v-if="brushStore.tool === 'icon' && !shiftHeld && snapStore.snapMode === 'node'"
    :cx="snapPos.x"
    :cy="snapPos.y"
    r="4"
    fill="white"
    opacity="0.8"
    pointer-events="none"
  />
</template>
