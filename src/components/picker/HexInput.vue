<template>
  <div class="hex-input-wrapper">
    <input
      class="hex-input"
      type="text"
      :value="localValue"
      maxlength="7"
      spellcheck="false"
      @input="onInput"
      @change="onCommit"
      @blur="onCommit"
      @focus="onFocus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useColorPickerStore } from '../../stores/colorPickerStore'

const colorPicker = useColorPickerStore()

const localValue = ref(colorPicker.hex)
let isFocused = false

watch(
  () => colorPicker.hex,
  (hex) => {
    if (!isFocused) localValue.value = hex
  },
)

function onFocus() {
  isFocused = true
}

function onInput(e: Event) {
  localValue.value = (e.target as HTMLInputElement).value
}

function onCommit() {
  isFocused = false
  colorPicker.setHex(localValue.value)
  localValue.value = colorPicker.hex
}
</script>

<style scoped>
.hex-input-wrapper {
  display: flex;
  align-items: center;
}

.hex-input {
  width: 80px;
  padding: 4px 6px;
  font-size: 12px;
  font-family: monospace;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  text-align: center;
  outline: none;
}

.hex-input:focus {
  border-color: rgba(255, 255, 255, 0.5);
}
</style>
