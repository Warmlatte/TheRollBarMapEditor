<template>
  <div class="py-0.5">
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

    <div class="slider-row">
      <label class="slabel">虛線</label>
      <input
        type="checkbox"
        :checked="lineStore.dashed"
        @change="lineStore.setDashed(($event.target as HTMLInputElement).checked)"
      />
    </div>

    <svg class="icon-preview" viewBox="0 0 100 40">
      <line
        x1="5" y1="20" x2="95" y2="20"
        stroke="#ddd"
        :stroke-width="lineStore.lineWidth"
        :stroke-dasharray="lineStore.dashed ? '8 4' : 'none'"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useLineStore } from '../stores/lineStore'

const lineStore = useLineStore()
</script>
