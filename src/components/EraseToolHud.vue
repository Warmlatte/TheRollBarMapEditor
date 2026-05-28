<template>
  <div class="py-0.5">
    <div class="slider-row">
      <span class="slabel">{{ t('erase_radius_label') }}</span>
      <input
        type="range"
        min="5"
        max="200"
        step="1"
        :value="eraseStore.radius"
        @input="eraseStore.setRadius(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ eraseStore.radius }}</span>
    </div>

    <hr class="hud-divider" />

    <div class="slabel mb-1">{{ t('erase_targets_label') }}</div>

    <div class="grid grid-cols-2 gap-2">
      <SwitchToggle
        v-for="key in targetKeys"
        :key="key"
        :model-value="eraseStore.targets[key]"
        :label="targetLabel(key)"
        @update:model-value="eraseStore.toggleTarget(key)"
      />
    </div>

    <button class="mt-2 px-2 py-1 text-xs" type="button" @click="eraseStore.selectAllTargets()">
      {{ t('erase_target_all') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import SwitchToggle from './SwitchToggle.vue'
import { useEraseStore } from '../stores/eraseStore'
import { useI18nStore } from '../stores/i18nStore'

const eraseStore = useEraseStore()
const { t } = useI18nStore()

const targetKeys = ['hex', 'icon', 'line', 'doodle'] as const
type TargetKey = typeof targetKeys[number]

function targetLabel(key: TargetKey): string {
  return t(`erase_target_${key}`)
}
</script>
