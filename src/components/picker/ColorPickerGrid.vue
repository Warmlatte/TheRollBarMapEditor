<template>
  <div class="my-1 grid grid-cols-2 items-center gap-x-2 gap-y-1.5">
    <slot name="preview" />
    <SvSquare />
    <HuePicker class="col-span-2" />
    <HexInput />
    <span class="overflow-hidden text-ellipsis whitespace-nowrap text-right font-mono text-[11px]" :style="{ color: brush.color }">{{ brush.color }}</span>
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
