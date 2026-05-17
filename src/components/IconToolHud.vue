<template>
  <div class="py-0.5">
    <div class="slider-row">
      <span class="slabel">大小</span>
      <input
        type="range"
        min="10"
        max="80"
        step="2"
        :value="iconStore.iconSize"
        @input="iconStore.setSize(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ iconStore.iconSize }}</span>
    </div>

    <div class="slider-row">
      <span class="slabel">旋轉</span>
      <input
        type="range"
        min="0"
        max="360"
        step="15"
        :value="iconStore.iconRotation"
        @input="iconStore.setRotation(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ iconStore.iconRotation }}°</span>
    </div>

    <svg class="icon-preview" viewBox="0 0 80 80">
      <polygon
        :points="hexOutline"
        fill="none"
        stroke="#555"
        stroke-width="1"
      />
      <g :transform="`rotate(${iconStore.iconRotation}, 40, 40)`">
        <g v-if="iconStore.selectedSvg" v-html="iconStore.selectedSvg" />
        <text
          v-else
          x="40"
          y="45"
          text-anchor="middle"
          fill="#555"
          font-size="20"
        >?</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useIconStore } from '../stores/iconStore'
import { hexCorners } from '../lib/hexMath'

const iconStore = useIconStore()
const hexOutline = hexCorners(40, 40, 30)
</script>
