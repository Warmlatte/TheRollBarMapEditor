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
    <button
      class="hud-btn w-full"
      data-testid="save-cell-btn"
      @click="brushStore.saveCurrentCell()"
    >
      儲存色塊
    </button>

    <div
      v-if="brushStore.savedCells.length > 0"
      data-testid="saved-cells-section"
      class="mt-1 flex flex-wrap gap-1"
    >
      <div
        v-for="cell in brushStore.savedCells"
        :key="cell.id"
        class="relative cursor-pointer"
        data-testid="saved-cell-thumb"
        @click="brushStore.applySavedCell(cell.id)"
      >
        <svg :viewBox="`0 0 ${thumbSize} ${thumbSize}`" :width="thumbSize" :height="thumbSize">
          <polygon :points="thumbPoints" :fill="cell.color" />
        </svg>
        <button
          class="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-700 text-[8px] leading-none text-zinc-200 hover:bg-red-600"
          data-testid="saved-cell-remove"
          @click.stop="brushStore.removeSavedCell(cell.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColorPickerGrid from './picker/ColorPickerGrid.vue'
import { useBrushStore } from '../stores/brushStore'
import { hexCorners } from '../lib/hexMath'

const brushStore = useBrushStore()
const hexPoints = hexCorners(20, 20, 16)

const thumbSize = 28
const thumbPoints = hexCorners(thumbSize / 2, thumbSize / 2, thumbSize / 2 - 2)
</script>
