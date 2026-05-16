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
  <div class="floating-toolbar">
    <button
      v-for="tool in TOOLS"
      :key="tool.id"
      :title="i18n.t(tool.i18nKey)"
      :class="[
        'tool-btn',
        tool.variant === 'danger' ? 'btn-danger' : '',
        brushStore.tool === tool.id ? 'active' : '',
      ]"
      @click="selectTool(tool.id)"
    />
  </div>
</template>
