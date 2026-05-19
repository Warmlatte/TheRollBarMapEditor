import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_TOOL_COLOR } from './brushStore'

export type SavedIconPreset = {
  svgId: string
  color: string
}

const DEFAULT_SAVED_ICON_PRESETS: SavedIconPreset[] = [
  { svgId: 'mountain', color: '#7a7a7a' },
  { svgId: 'tree', color: '#4a7a3a' },
  { svgId: 'tower', color: '#7a4a2a' },
  { svgId: 'skull', color: '#c33232' },
]

export const useIconStore = defineStore('icon', () => {
  const selectedSvgId = ref<string | null>(null)
  const size = ref(65)
  const rotation = ref(0)
  const color = ref(DEFAULT_TOOL_COLOR)
  const savedIcons = ref<SavedIconPreset[]>([...DEFAULT_SAVED_ICON_PRESETS])

  function setSelectedSvgId(id: string | null): void {
    selectedSvgId.value = id
  }

  function setSize(s: number): void {
    size.value = s
  }

  function setRotation(r: number): void {
    rotation.value = r
  }

  function setColor(c: string): void {
    color.value = c
  }

  function saveCurrentIcon(): void {
    if (!selectedSvgId.value) return
    const preset = { svgId: selectedSvgId.value, color: color.value }
    if (savedIcons.value.some((icon) => icon.svgId === preset.svgId && icon.color === preset.color)) {
      return
    }
    savedIcons.value = [...savedIcons.value, preset]
  }

  return {
    selectedSvgId,
    size,
    rotation,
    color,
    savedIcons,
    setSelectedSvgId,
    setSize,
    setRotation,
    setColor,
    saveCurrentIcon,
  }
})
