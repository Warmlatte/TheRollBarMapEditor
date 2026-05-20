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
      @click="handleSaveCell"
    >
      儲存色塊
    </button>

    <div
      v-if="brushStore.savedCells.length > 0"
      data-testid="saved-cells-section"
      class="saved-icons-section"
    >
      <div class="saved-icons-title">已存色塊</div>
      <div class="icon-picker" role="radiogroup" aria-label="saved cell picker">
        <div
          v-for="cell in brushStore.savedCells"
          :key="cell.id"
          class="icon-cell-wrap"
        >
          <button
            class="icon-cell"
            :class="{ active: brushStore.color === cell.color }"
            data-testid="saved-cell-thumb"
            @click="brushStore.applySavedCell(cell.id)"
          >
            <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">
              <polygon :points="thumbPoints" :fill="cell.color" />
            </svg>
          </button>
          <button
            class="icon-cell-x"
            data-testid="saved-cell-remove"
            @click.stop="handleRemoveCell(cell.id)"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColorPickerGrid from './picker/ColorPickerGrid.vue'
import { useBrushStore } from '../stores/brushStore'
import { useToastStore } from '../stores/toastStore'
import { hexCorners } from '../lib/hexMath'

const brushStore = useBrushStore()
const toastStore = useToastStore()
const hexPoints = hexCorners(20, 20, 16)
const thumbPoints = hexCorners(20, 20, 17)

function handleSaveCell(): void {
  const alreadyExists = brushStore.savedCells.some((c) => c.color === brushStore.color)
  brushStore.saveCurrentCell()
  if (alreadyExists) {
    toastStore.pushToast('此顏色已在色塊清單中', 'info')
  } else {
    toastStore.pushToast('色塊已儲存', 'success')
  }
}

function handleRemoveCell(id: string): void {
  brushStore.removeSavedCell(id)
  toastStore.pushToast('色塊已移除', 'info')
}
</script>
