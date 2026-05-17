<template>
  <div class="py-0.5">
    <div class="slider-row">
      <span class="slabel">半徑</span>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        :value="eraseStore.eraseRadius"
        @input="eraseStore.setRadius(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ eraseStore.eraseRadius }}</span>
    </div>

    <hr class="hud-divider" />

    <div class="grid grid-cols-2 gap-1">
      <button
        v-for="key in targetKeys"
        :key="key"
        class="target-btn"
        :class="{ active: eraseStore.targets[key] }"
        @click="eraseStore.toggleTarget(key)"
      >{{ targetLabels[key] }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEraseStore } from '../stores/eraseStore'

const eraseStore = useEraseStore()

const targetKeys = ['hex', 'icon', 'line', 'doodle'] as const
const targetLabels: Record<string, string> = {
  hex: '格子',
  icon: '圖示',
  line: '線條',
  doodle: '塗鴉',
}
</script>
