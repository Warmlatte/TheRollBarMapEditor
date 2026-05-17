<template>
  <div class="picker-grid">
    <SvSquare />
    <slot name="preview" />
    <HuePicker class="hue-full" />
    <HexInput />
    <span class="color-label" :style="{ color: brush.color }">{{ brush.color }}</span>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import SvSquare from './SvSquare.vue'
import HuePicker from './HuePicker.vue'
import HexInput from './HexInput.vue'
import { useColorPickerStore } from '../../stores/colorPickerStore'
import { useBrushStore } from '../../stores/brushStore'

const colorPicker = useColorPickerStore()
const brush = useBrushStore()

onMounted(() => {
  watch(
    () => colorPicker.hex,
    (hex) => brush.setColor(hex),
    { immediate: true },
  )
})
</script>

<style scoped>
.picker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 8px;
  row-gap: 6px;
  align-items: center;
  margin: 4px 0;
}

.hue-full {
  grid-column: 1 / -1;
}

.color-label {
  font-size: 11px;
  font-family: Consolas, Menlo, monospace;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
