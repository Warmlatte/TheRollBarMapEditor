import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_TOOL_COLOR } from './brushStore'

export type SavedIconPreset = {
  id: string
  svgId: string
  color: string
  size: number
  rotation: number
}

const DEFAULT_SAVED_ICON_PRESETS: SavedIconPreset[] = [
  { id: 'mountain-default', svgId: 'mountain', color: '#7a7a7a', size: 100, rotation: 0 },
  { id: 'tree-default', svgId: 'tree', color: '#4a7a3a', size: 100, rotation: 0 },
  { id: 'tower-default', svgId: 'tower', color: '#7a4a2a', size: 100, rotation: 0 },
  { id: 'skull-default', svgId: 'skull', color: '#c33232', size: 100, rotation: 0 },
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
    size.value = Math.max(10, Math.min(300, s))
  }

  function setRotation(r: number): void {
    rotation.value = ((r % 360) + 360) % 360
  }

  function setColor(c: string): void {
    color.value = c
  }

  function saveCurrentIcon(): void {
    if (!selectedSvgId.value) return
    const preset = {
      id: `${selectedSvgId.value}-${color.value.slice(1)}-${size.value}-${rotation.value}`,
      svgId: selectedSvgId.value,
      color: color.value,
      size: size.value,
      rotation: rotation.value,
    }
    if (
      savedIcons.value.some((icon) =>
        icon.svgId === preset.svgId &&
        icon.color === preset.color &&
        icon.size === preset.size &&
        icon.rotation === preset.rotation)
    ) {
      return
    }
    savedIcons.value = [...savedIcons.value, preset]
  }

  function removeSavedIcon(id: string): void {
    savedIcons.value = savedIcons.value.filter((icon) => icon.id !== id)
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
    removeSavedIcon,
  }
})
