<template>
  <div class="py-0.5">
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
    <div class="slider-row">
      <label class="slabel">虛線</label>
      <input
        type="checkbox"
        :checked="lineStore.dashed"
        @change="lineStore.setDashed(($event.target as HTMLInputElement).checked)"
      />
    </div>

    <!-- dashLength slider (only when dashed) -->
    <div v-if="lineStore.dashed" class="slider-row">
      <span class="slabel">線長</span>
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

    <!-- dashGap slider (only when dashed) -->
    <div v-if="lineStore.dashed" class="slider-row">
      <span class="slabel">間距</span>
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

    <!-- 線條預覽 -->
    <svg class="icon-preview" viewBox="0 0 100 40">
      <line
        x1="5" y1="20" x2="95" y2="20"
        stroke="#ddd"
        :stroke-width="lineStore.lineWidth"
        :stroke-dasharray="lineStore.dashed ? `${lineStore.dashLength} ${lineStore.dashGap}` : 'none'"
        stroke-linecap="round"
      />
    </svg>

    <hr class="hud-divider" />

    <!-- 儲存按鈕 -->
    <button class="hud-btn w-full" @click="handleSave">
      儲存線條
    </button>

    <!-- Saved presets grid -->
    <div v-if="lineStore.savedLines.length > 0" class="saved-icons-section">
      <div class="saved-icons-title">已存線條</div>
      <div class="icon-picker" role="radiogroup" aria-label="saved line picker">
        <div
          v-for="saved in lineStore.savedLines"
          :key="saved.id"
          class="icon-cell-wrap"
        >
          <button
            class="icon-cell"
            :title="`w${saved.width} ${saved.dashed ? '虛線' : '實線'}`"
            @click="handleApply(saved.id)"
          >
            <svg viewBox="0 0 40 24" width="36" height="24" aria-hidden="true">
              <line
                x1="2" y1="12" x2="38" y2="12"
                :stroke="saved.color"
                :stroke-width="Math.min(saved.width, 6)"
                :stroke-dasharray="saved.dashed ? `${saved.dashLength} ${saved.dashGap}` : 'none'"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button
            class="icon-cell-x"
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
import { useLineStore } from '../stores/lineStore'
import { useBrushStore } from '../stores/brushStore'

const lineStore = useLineStore()
const brushStore = useBrushStore()

function handleSave(): void {
  lineStore.saveCurrentLine(brushStore.currentColor)
}

function handleApply(id: string): void {
  const entry = lineStore.applySavedLine(id)
  if (entry) {
    brushStore.setColor(entry.color)
  }
}
</script>
