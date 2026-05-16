<script setup lang="ts">
import { useBrushStore } from '../stores/brushStore'
import type { Tool } from '../stores/brushStore'
import { TOOLS } from '../tools/registry'

const brushStore = useBrushStore()

function selectTool(id: string) {
  brushStore.setTool(id as Tool)
}
</script>

<template>
  <div class="floating-toolbar">
    <button
      v-for="tool in TOOLS"
      :key="tool.id"
      :title="tool.i18nKey"
      :class="[
        'tool-btn',
        tool.variant === 'danger' ? 'btn-danger' : '',
        brushStore.tool === tool.id ? 'active' : '',
      ]"
      @click="selectTool(tool.id)"
    />
  </div>
</template>
