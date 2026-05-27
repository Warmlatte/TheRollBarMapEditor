<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>(), {
  label: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle(): void {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    class="switch-toggle"
    :style="disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined"
    :aria-pressed="modelValue"
    :disabled="disabled"
    @click="toggle"
  >
    <slot />
    <span
      class="switch-track"
      :class="modelValue ? 'is-on' : 'is-off'"
      aria-hidden="true"
    >
      <span class="switch-thumb" />
    </span>
    <span v-if="label" class="switch-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.switch-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #ddd;
  cursor: pointer;
  padding: 0;
}

.switch-track {
  position: relative;
  width: 30px;
  height: 16px;
  border-radius: 8px;
  transition: background 0.18s, border-color 0.18s;
}

.switch-track.is-on {
  background: #4a6e3a;
  border: 1px solid #6a9a52;
}

.switch-track.is-off {
  background: #333;
  border: 1px solid #555;
}

.switch-thumb {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: transform 0.18s;
}

.switch-track.is-on .switch-thumb {
  background: #e8dcc4;
  transform: translateX(14px);
}

.switch-track.is-off .switch-thumb {
  background: #888;
  transform: translateX(0);
}

.switch-label {
  color: #ddd;
  font-size: 12px;
  font-weight: 600;
}

.switch-toggle:has(.is-off) .switch-label {
  color: #666;
}
</style>
