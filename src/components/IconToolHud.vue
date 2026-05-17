<template>
  <div class="py-0.5">
    <div v-if="libStore.icons.length === 0" class="hud-empty">
      {{ i18n.t('icon.empty') }}
    </div>

    <div class="icon-library-grid">
      <div
        v-for="entry in libStore.icons"
        :key="entry.id"
        class="icon-library-item"
        :class="{ selected: iconStore.selectedSvgId === entry.id }"
      >
        <button
          :data-testid="`icon-select-${entry.id}`"
          class="icon-thumb-btn"
          :title="entry.name"
          @click="iconStore.setSelectedSvgId(entry.id)"
        >
          <span class="icon-thumb-svg" v-html="displaySvg(entry.rawSvg)" />
          <span class="icon-name">{{ entry.name }}</span>
        </button>
        <button
          :data-testid="`icon-delete-${entry.id}`"
          class="hud-btn icon-delete-btn"
          @click="handleDelete(entry.id)"
        >
          {{ i18n.t('icon.delete') }}
        </button>
      </div>
    </div>

    <label class="hud-btn icon-upload-label">
      {{ i18n.t('icon.upload') }}
      <input
        data-testid="icon-upload"
        type="file"
        accept=".svg,image/svg+xml"
        class="sr-only"
        @change="handleUpload"
      />
    </label>

    <div class="hud-divider" />

    <div class="slider-row">
      <span class="slabel">{{ i18n.t('icon.size') }}</span>
      <input
        type="range"
        min="10"
        max="80"
        step="2"
        :value="iconStore.size"
        @input="iconStore.setSize(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ iconStore.size }}</span>
    </div>

    <div class="slider-row">
      <span class="slabel">{{ i18n.t('icon.rotation') }}</span>
      <input
        type="range"
        min="0"
        max="360"
        step="15"
        :value="iconStore.rotation"
        @input="iconStore.setRotation(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="value-mini">{{ iconStore.rotation }}°</span>
    </div>

    <div class="slider-row">
      <span class="slabel">{{ i18n.t('icon.color') }}</span>
      <input
        type="color"
        :value="iconStore.color"
        @input="iconStore.setColor(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useIconStore } from '../stores/iconStore'
import { useIconLibraryStore, getDisplaySvg } from '../stores/iconLibraryStore'
import { useI18nStore } from '../stores/i18nStore'

const iconStore = useIconStore()
const libStore = useIconLibraryStore()
const i18n = useI18nStore()

onMounted(() => {
  libStore.loadIcons()
})

function displaySvg(rawSvg: string): string {
  return getDisplaySvg(rawSvg)
}

async function handleDelete(id: string): Promise<void> {
  await libStore.deleteIcon(id)
  if (iconStore.selectedSvgId === id) {
    iconStore.setSelectedSvgId(null)
  }
}

function handleUpload(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = (e.target as FileReader).result as string
    const name = file.name.replace(/\.svg$/i, '')
    libStore.addIcon(content, name)
  }
  reader.onerror = () => {}
  reader.readAsText(file)
}
</script>
