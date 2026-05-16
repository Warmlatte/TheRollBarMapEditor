<template>
  <div class="color-picker-grid">
    <SvSquare />
    <HuePicker />
    <HexInput />
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
.color-picker-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}
</style>
