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
    >{{ i18n.t(tool.i18nKey) }}</button>
  </div>
</template>

<style>
.floating-toolbar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.65);
  padding: 6px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.tool-btn {
  background: #333;
  border: 1px solid #555;
  color: #ddd;
  border-radius: 4px;
  padding: 6px 12px;
  min-width: 60px;
  font-size: 12px;
  cursor: pointer;
}
.tool-btn:hover { background: #444; }

.tool-btn.active {
  background: #4a6e3a;
  border-color: #6a9a52;
  color: #fff;
}
.tool-btn.active:hover { background: #5a8045; }

.tool-btn.btn-danger.active {
  background: #8a3a2e;
  border-color: #c25a4a;
  color: #fff;
}
.tool-btn.btn-danger.active:hover { background: #a14538; }
</style>
