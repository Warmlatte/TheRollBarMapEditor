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
  width: 100%;
  padding: 3px 4px;
  font-size: 11px;
  font-family: Consolas, Menlo, monospace;
  text-transform: lowercase;
  background: #1f1f1f;
  border: 1px solid #555;
  border-radius: 3px;
  color: #ddd;
  outline: none;
}

.hex-input:focus {
  border-color: #6a9a52;
}
</style>
