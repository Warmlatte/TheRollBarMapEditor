<template>
  <div class="py-0.5">
    <div class="slider-row">
      <span class="slabel">筆寬</span>
      <input
        type="range"
        min="1"
        max="20"
        step="1"
        :value="doodleStore.doodleWidth"
        @input="doodleStore.setWidth(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ doodleStore.doodleWidth }}</span>
    </div>

    <div class="slider-row">
      <span class="slabel">不透明度</span>
      <input
        type="range"
        min="0.1"
        max="1"
        step="0.05"
        :value="doodleStore.doodleOpacity"
        @input="doodleStore.setOpacity(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ Math.round(doodleStore.doodleOpacity * 100) }}%</span>
    </div>

    <svg class="icon-preview" viewBox="0 0 100 60">
      <path
        d="M10,50 C20,10 40,50 60,20 S90,40 95,30"
        fill="none"
        stroke="#ddd"
        :stroke-width="doodleStore.doodleWidth"
        :opacity="doodleStore.doodleOpacity"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useDoodleStore } from '../stores/doodleStore'

const doodleStore = useDoodleStore()
</script>
