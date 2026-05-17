<script setup lang="ts">
import { computed } from 'vue'
import { useBrushStore } from '../../stores/brushStore'
import { useIconStore } from '../../stores/iconStore'
import { useIconLibraryStore, getDisplaySvg } from '../../stores/iconLibraryStore'

defineProps<{ cursorX: number; cursorY: number }>()

const brushStore = useBrushStore()
const iconStore = useIconStore()
const libStore = useIconLibraryStore()

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
    v-if="brushStore.tool === 'icon'"
    :transform="`translate(${cursorX}, ${cursorY}) scale(${iconStore.size}) rotate(${iconStore.rotation})`"
    opacity="0.5"
  >
    <g v-if="displaySvg" v-html="displaySvg" />
    <g v-else>
      <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" stroke-width="2" />
      <line x1="0" y1="-12" x2="0" y2="12" stroke="currentColor" stroke-width="2" />
    </g>
  </g>
</template>
