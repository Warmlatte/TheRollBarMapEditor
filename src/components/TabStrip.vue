<script setup lang="ts">
import { ref } from 'vue'

export interface Tab {
  id: string
  name: string
}

withDefaults(defineProps<{
  activeId: string | null
  tabs: Tab[]
  logoSrc?: string
  mapListOpen?: boolean
}>(), {
  logoSrc: '',
  mapListOpen: false,
})

const emit = defineEmits<{
  'update:activeId': [id: string]
  add: []
  'open-map-list': []
  reorder: [from: number, to: number]
  rename: [id: string, name: string]
}>()

const dragIdx = ref<number | null>(null)
const overIdx = ref<number | null>(null)
const editingId = ref<string | null>(null)
const editingName = ref('')

function onDragStart(idx: number): void {
  dragIdx.value = idx
}

function onDragOver(event: DragEvent, idx: number): void {
  event.preventDefault()
  overIdx.value = idx
}

function onDrop(idx: number): void {
  if (dragIdx.value !== null && dragIdx.value !== idx) {
    emit('reorder', dragIdx.value, idx)
  }
  dragIdx.value = null
  overIdx.value = null
}

function onDragEnd(): void {
  dragIdx.value = null
  overIdx.value = null
}

function startRename(tab: Tab): void {
  editingId.value = tab.id
  editingName.value = tab.name
}

function commitRename(tab: Tab): void {
  if (editingId.value !== tab.id) return
  const name = editingName.value.trim()
  editingId.value = null
  editingName.value = ''
  if (name !== '' && name !== tab.name) {
    emit('rename', tab.id, name)
  }
}

function cancelRename(): void {
  editingId.value = null
  editingName.value = ''
}
</script>

<template>
  <div data-testid="tab-strip" class="tab-strip">
    <div v-if="logoSrc" class="tab-brand">
      <span
        class="tab-brand-mark"
        aria-hidden="true"
        :style="{ maskImage: `url(${logoSrc})`, WebkitMaskImage: `url(${logoSrc})` }"
      />
      <span>
        <span class="tab-brand-studio">THE ROLL BAR</span>
        <span class="tab-brand-product">地圖編輯器</span>
      </span>
    </div>
    <div v-if="logoSrc" class="tab-sep" aria-hidden="true" />

    <button
      v-for="(tab, idx) in tabs"
      :key="tab.id"
      class="tab-btn"
      :class="{
        'is-active': tab.id === activeId,
        'is-dragging': dragIdx === idx,
        'is-drag-over': overIdx === idx,
      }"
      draggable="true"
      @click="emit('update:activeId', tab.id)"
      @dragstart="onDragStart(idx)"
      @dragover="onDragOver($event, idx)"
      @drop="onDrop(idx)"
      @dragend="onDragEnd"
    >
      <svg class="tab-hex-icon" viewBox="0 0 14 14" aria-hidden="true">
        <polygon points="7,1 12,3.8 12,10.2 7,13 2,10.2 2,3.8" />
      </svg>
      <input
        v-if="editingId === tab.id"
        v-model="editingName"
        data-testid="tab-name-input"
        class="tab-name-input"
        @click.stop
        @keydown.enter.stop.prevent="commitRename(tab)"
        @keydown.esc.stop.prevent="cancelRename"
        @blur="commitRename(tab)"
      />
      <span v-else class="tab-name" @dblclick.stop="startRename(tab)">{{ tab.name }}</span>
      <span class="tab-indicator" :class="{ 'is-on': tab.id === activeId }" />
    </button>

    <button class="tab-add-btn" aria-label="new tab" @click="emit('add')">+</button>

    <button
      class="tab-btn map-list-btn"
      :class="{ 'is-active': mapListOpen }"
      @click="emit('open-map-list')"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h12" />
      </svg>
      <span>地圖</span>
    </button>
  </div>
</template>

<style scoped>
.tab-strip {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 3px;
  width: max-content;
  max-width: calc(100vw - 24px);
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 4px 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.tab-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 5px 0 1px;
}

.tab-brand-mark {
  display: block;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  background: #e8dcc4;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

.tab-brand-studio,
.tab-brand-product {
  display: block;
  line-height: 1.1;
}

.tab-brand-studio {
  color: #aaa;
  font-size: 8px;
  letter-spacing: 0.18em;
}

.tab-brand-product {
  color: #ddd;
  font-size: 11px;
  font-weight: 700;
}

.tab-sep {
  width: 1px;
  height: 22px;
  margin: 0 3px;
  background: rgba(255, 255, 255, 0.1);
}

.tab-btn,
.tab-add-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  border-radius: 5px;
  color: #888;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s, opacity 0.15s;
}

.tab-btn {
  min-width: 54px;
  border: 1px solid transparent;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 600;
}

.tab-btn:hover {
  color: #ddd;
  background: rgba(255, 255, 255, 0.04);
}

.tab-btn.is-active {
  color: #fff;
  background: rgba(74, 110, 58, 0.2);
  border: 1px solid rgba(106, 154, 82, 0.25);
}

.tab-btn.is-dragging {
  opacity: 0.4;
}

.tab-btn.is-drag-over {
  border-color: rgba(106, 154, 82, 0.7);
}

.tab-hex-icon {
  width: 11px;
  height: 11px;
  opacity: 0.6;
  fill: rgba(255, 255, 255, 0.06);
  stroke: currentColor;
  transition: opacity 0.15s;
}

.tab-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-name-input {
  width: 76px;
  min-width: 0;
  border: 1px solid rgba(232, 220, 196, 0.42);
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font: inherit;
  padding: 1px 4px;
  outline: none;
}

.tab-btn.is-active .tab-hex-icon {
  opacity: 1;
}

.tab-indicator {
  position: absolute;
  left: 7px;
  right: 7px;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
  background: #6a9a52;
  transform: scaleX(0);
  transition: transform 0.15s;
}

.tab-indicator.is-on {
  transform: scaleX(1);
}

.tab-add-btn {
  min-width: 28px;
  height: 28px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: #666;
  font-size: 16px;
  line-height: 1;
}

.tab-add-btn:hover {
  color: #aaa;
  border-color: rgba(255, 255, 255, 0.35);
}

.map-list-btn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
}
</style>
