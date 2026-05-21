<template>
  <div class="py-0.5">
    <ColorPickerGrid>
      <template #preview>
        <svg
          class="icon-preview icon-preview-big"
          viewBox="-50 -50 100 100"
          aria-hidden="true"
        >
          <polygon
            :points="hexPreviewPoints"
            fill="rgba(255,255,255,0.03)"
            stroke="#555"
            stroke-width="1.5"
            stroke-dasharray="3 3"
          />
          <line
            x1="-40" y1="40"
            x2="40" y2="-40"
            :stroke="brushStore.currentColor"
            :stroke-width="lineStore.lineWidth"
            stroke-linecap="round"
            :stroke-dasharray="lineStore.dashed ? `${lineStore.dashLength} ${lineStore.dashGap}` : undefined"
          />
        </svg>
      </template>
    </ColorPickerGrid>

    <!-- snap mode 移至 sliders 上方 -->
    <div class="snap-row" role="group" aria-label="snap mode">
      <button
        class="snap-btn"
        :class="{ active: snapStore.snapMode === 'free' }"
        @click="snapStore.setMode('free')"
      >
        自由
      </button>
      <button
        class="snap-btn"
        :class="{ active: snapStore.snapMode === 'node' }"
        @click="snapStore.setMode('node')"
      >
        節點
      </button>
    </div>

    <!-- 線寬 slider -->
    <div class="slider-row">
      <span class="slabel">線寬</span>
      <input
        type="range"
        min="1"
        max="12"
        step="1"
        :value="lineStore.lineWidth"
        @input="lineStore.setWidth(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ lineStore.lineWidth }}</span>
    </div>

    <!-- 虛線 checkbox -->
    <label class="dash-checkbox">
      <input
        type="checkbox"
        :checked="lineStore.dashed"
        @change="lineStore.setDashed(($event.target as HTMLInputElement).checked)"
      />
      虛線
    </label>

    <!-- 段長 slider (only when dashed) -->
    <div v-if="lineStore.dashed" class="slider-row">
      <span class="slabel">段長</span>
      <input
        type="range"
        min="1"
        max="40"
        step="1"
        :value="lineStore.dashLength"
        @input="lineStore.setDashLength(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ lineStore.dashLength }}</span>
    </div>

    <!-- 段距 slider (only when dashed) -->
    <div v-if="lineStore.dashed" class="slider-row">
      <span class="slabel">段距</span>
      <input
        type="range"
        min="1"
        max="40"
        step="1"
        :value="lineStore.dashGap"
        @input="lineStore.setDashGap(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ lineStore.dashGap }}</span>
    </div>

    <hr class="hud-divider" />

    <!-- 儲存按鈕（非全寬，放在 row 容器） -->
    <div class="line-save-row">
      <button class="hud-btn" @click="handleSave">儲存線條</button>
    </div>

    <!-- Saved presets banner grid -->
    <div v-if="lineStore.savedLines.length > 0" class="saved-icons-section">
      <div class="saved-icons-title">已存線條</div>
      <div class="banner-grid" role="radiogroup" aria-label="saved line picker">
        <div
          v-for="saved in lineStore.savedLines"
          :key="saved.id"
          class="banner-cell-wrap"
        >
          <button
            class="banner-cell"
            :title="`w${saved.width} ${saved.dashed ? '虛線' : '實線'}`"
            @click="handleApply(saved.id)"
          >
            <svg viewBox="-50 -8 100 16" width="100%" height="20" preserveAspectRatio="none" aria-hidden="true">
              <line
                x1="-44" y1="0"
                x2="44" y2="0"
                :stroke="saved.color"
                :stroke-width="Math.min(saved.width, 6)"
                :stroke-dasharray="saved.dashed ? `${saved.dashLength} ${saved.dashGap}` : 'none'"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button
            class="icon-cell-x"
            aria-label="移除"
            @click.stop="lineStore.removeSavedLine(saved.id)"
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
import { useLineStore } from '../stores/lineStore'
import { useBrushStore } from '../stores/brushStore'
import { useSnapStore } from '../stores/snapStore'
import { useToastStore } from '../stores/toastStore'
import { hexCorners } from '../lib/hexMath'

const lineStore = useLineStore()
const brushStore = useBrushStore()
const snapStore = useSnapStore()
const toastStore = useToastStore()

const hexPreviewPoints = hexCorners(0, 0, 42)

function handleSave(): void {
  lineStore.saveCurrentLine(brushStore.currentColor)
  toastStore.pushToast('線條已儲存', 'success')
}

function handleApply(id: string): void {
  const entry = lineStore.applySavedLine(id)
  if (entry) {
    brushStore.setColor(entry.color)
    toastStore.pushToast('線條已套用', 'success')
  }
}
</script>

<style scoped>
.line-save-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 2px 0;
}

.dash-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  margin: 4px 0;
}
.dash-checkbox input[type='checkbox'] {
  accent-color: #6a9a52;
}
</style>
