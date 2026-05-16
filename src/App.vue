<script setup lang="ts">
import { computed } from 'vue'
import FloatingToolbar from './components/FloatingToolbar.vue'
import { TOOLS } from './tools/registry'
import { useBrushStore } from './stores/brushStore'

const brushStore = useBrushStore()
const activeHud = computed(() => TOOLS.find(t => t.id === brushStore.tool)?.hud)
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <div class="hud-panel">
      <component :is="activeHud" v-if="activeHud" />
    </div>
    <FloatingToolbar />
  </div>
</template>

<style>
.hud-panel {
  position: fixed;
  top: 16px;
  left: 16px;
  width: 220px;
  background: rgba(30, 30, 40, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  z-index: 10;
}
</style>
