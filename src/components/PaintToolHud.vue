<template>
  <div class="paint-tool-hud">
    <ColorPickerGrid />
  </div>
</template>

<script setup lang="ts">
import ColorPickerGrid from './picker/ColorPickerGrid.vue'
</script>

<style scoped>
.paint-tool-hud {
  padding: 8px;
}
</style>
