<template>
  <div class="py-0.5">
    <ColorPickerGrid>
      <template #preview>
        <svg viewBox="0 0 40 40" class="icon-preview aspect-square">
          <rect width="40" height="40" fill="#1a1a1a" />
          <polygon :points="hexPoints" :fill="brushStore.color" />
        </svg>
      </template>
    </ColorPickerGrid>

    <hr class="hud-divider" />
    <button class="hud-btn w-full" @click="brushStore.saveCurrentCell()">
      儲存色塊
    </button>
  </div>
</template>

<script setup lang="ts">
import ColorPickerGrid from './picker/ColorPickerGrid.vue'
import { useBrushStore } from '../stores/brushStore'
import { hexCorners } from '../lib/hexMath'

const brushStore = useBrushStore()
const hexPoints = hexCorners(20, 20, 16)
</script>
