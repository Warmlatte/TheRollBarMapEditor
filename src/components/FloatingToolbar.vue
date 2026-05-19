<script setup lang="ts">
import { useBrushStore } from '../stores/brushStore'
import type { Tool } from '../stores/brushStore'
import { useI18nStore } from '../stores/i18nStore'
import { TOOLS } from '../tools/registry'

const brushStore = useBrushStore()
const i18n = useI18nStore()

function selectTool(id: string) {
  brushStore.setTool(id as Tool)
}
</script>

<template>
  <div class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-md bg-black/65 p-1.5 backdrop-blur">
    <button
      v-for="tool in TOOLS"
      :key="tool.id"
      :title="i18n.t(tool.i18nKey)"
      :aria-pressed="brushStore.tool === tool.id"
      :class="[
        'tool-btn',
        tool.variant === 'danger' ? 'btn-danger' : '',
        brushStore.tool === tool.id ? 'active' : '',
      ]"
      @click="selectTool(tool.id)"
    >{{ i18n.t(tool.i18nKey) }}</button>
  </div>
</template>
