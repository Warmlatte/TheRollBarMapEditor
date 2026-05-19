<template>
  <div class="py-0.5">
    <ColorPickerGrid>
      <template #preview>
        <svg
          data-testid="icon-large-preview"
          class="icon-preview icon-preview-big"
          viewBox="-120 -120 240 240"
          aria-hidden="true"
        >
          <polygon
            :points="previewHexPoints"
            fill="rgba(255,255,255,0.03)"
            stroke="#555"
            stroke-width="1.5"
            stroke-dasharray="3 3"
          />
          <g
            :transform="`rotate(${iconStore.rotation}) scale(${(iconStore.size * 2) / 100}) translate(-50,-50)`"
            :fill="iconStore.color"
            :stroke="iconStore.color"
          >
            <g v-if="selectedDisplaySvg" v-html="selectedDisplaySvg" />
          </g>
        </svg>
      </template>
    </ColorPickerGrid>

    <div class="slider-row">
      <span class="slabel">{{ i18n.t('icon.size') }}</span>
      <input
        type="range"
        min="10"
        max="300"
        step="5"
        :value="iconStore.size"
        @input="iconStore.setSize(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini slider-trailing-fixed">{{ (iconStore.size / 100).toFixed(2) }}x</span>
    </div>

    <div class="slider-row">
      <span class="slabel">{{ i18n.t('icon.rotation') }}</span>
      <input
        type="range"
        min="0"
        max="360"
        step="1"
        :value="iconStore.rotation"
        @input="iconStore.setRotation(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="input-with-unit slider-trailing-fixed">
        <input
          class="angle-input angle-input-tight"
          type="text"
          inputmode="numeric"
          :value="Math.round(iconStore.rotation)"
          @input="handleAngleInput"
        />
        <span class="unit">°</span>
      </span>
    </div>

    <div class="snap-row" role="group" aria-label="snap mode">
      <button
        class="snap-btn"
        :class="{ active: snapStore.snapMode === 'free' }"
        @click="snapStore.setMode('free')"
      >
        自由
      </button>
      <button
        class="snap-btn"
        :class="{ active: snapStore.snapMode === 'node' }"
        @click="snapStore.setMode('node')"
      >
        節點
      </button>
    </div>

    <div v-if="libStore.icons.length === 0" class="hud-empty">
      {{ i18n.t('icon.empty') }}
    </div>

    <div class="icon-picker" role="radiogroup" aria-label="icon picker">
      <div
        v-for="entry in libStore.icons"
        :key="entry.id"
        class="icon-cell-wrap"
      >
        <button
          :data-testid="`icon-select-${entry.id}`"
          class="icon-cell"
          :class="{ active: iconStore.selectedSvgId === entry.id }"
          :title="entry.name"
          @click="handleSelectIcon(entry)"
        >
          <svg viewBox="0 0 100 100" width="28" height="28" aria-hidden="true">
            <g v-html="displaySvg(entry.rawSvg)" />
          </svg>
        </button>
        <button
          :data-testid="`icon-delete-${entry.id}`"
          class="icon-cell-x"
          :aria-label="i18n.t('icon.delete')"
          :title="i18n.t('icon.delete')"
          @click="handleDelete(entry.id)"
        >
          ×
        </button>
      </div>

      <label class="icon-cell plus" :title="i18n.t('icon.upload')" aria-label="upload icon">
        +
        <input
          data-testid="icon-upload"
          type="file"
          accept=".svg,image/svg+xml"
          class="sr-only"
          @change="handleUpload"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import ColorPickerGrid from './picker/ColorPickerGrid.vue'
import { useBrushStore } from '../stores/brushStore'
import { useIconStore } from '../stores/iconStore'
import { useIconLibraryStore, getDisplaySvg, type IconEntry } from '../stores/iconLibraryStore'
import { useI18nStore } from '../stores/i18nStore'
import { useSnapStore } from '../stores/snapStore'
import { hexCorners } from '../lib/hexMath'

const brushStore = useBrushStore()
const iconStore = useIconStore()
const libStore = useIconLibraryStore()
const snapStore = useSnapStore()
const i18n = useI18nStore()
const previewHexPoints = hexCorners(0, 0, 100)

const selectedEntry = computed(() =>
  iconStore.selectedSvgId
    ? libStore.icons.find((entry) => entry.id === iconStore.selectedSvgId)
    : undefined,
)

const selectedDisplaySvg = computed(() =>
  selectedEntry.value ? getDisplaySvg(selectedEntry.value.rawSvg) : '',
)

onMounted(() => {
  void libStore.loadIcons().then(() => {
    if (!iconStore.selectedSvgId && libStore.icons.length > 0) {
      iconStore.setSelectedSvgId(libStore.icons[0].id)
    }
  })
})

watch(
  () => brushStore.color,
  (color) => iconStore.setColor(color),
  { immediate: true },
)

function displaySvg(rawSvg: string): string {
  return getDisplaySvg(rawSvg)
}

function handleSelectIcon(entry: IconEntry): void {
  iconStore.setSelectedSvgId(entry.id)
  if (entry.defaultColor) {
    brushStore.setColor(entry.defaultColor)
  }
}

function handleAngleInput(event: Event): void {
  const value = Number.parseInt((event.target as HTMLInputElement).value, 10)
  if (!Number.isNaN(value)) {
    iconStore.setRotation(value)
  }
}

async function handleDelete(id: string): Promise<void> {
  await libStore.deleteIcon(id)
  if (iconStore.selectedSvgId === id) {
    iconStore.setSelectedSvgId(libStore.icons.find((entry) => entry.id !== id)?.id ?? null)
  }
}

function handleUpload(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const content = (e.target as FileReader).result as string
    const name = file.name.replace(/\.svg$/i, '')
    await libStore.addIcon(content, name)
    const uploaded = libStore.icons.find((entry) => entry.name === name)
    if (uploaded) iconStore.setSelectedSvgId(uploaded.id)
  }
  reader.onerror = () => {}
  reader.readAsText(file)
}
</script>
