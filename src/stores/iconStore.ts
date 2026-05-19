import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_TOOL_COLOR } from './brushStore'

export type SavedIconPreset = {
  svgId: string
  color: string
}

export const useIconStore = defineStore('icon', () => {
  const selectedSvgId = ref<string | null>(null)
  const size = ref(100)
  const rotation = ref(0)
  const color = ref(DEFAULT_TOOL_COLOR)
  const savedIcons = ref<SavedIconPreset[]>([])

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
