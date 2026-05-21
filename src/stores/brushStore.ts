import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createSavedPresetRegistry } from '../lib/savedPresetRegistry'

export type Tool = 'paint' | 'erase' | 'icon' | 'line' | 'doodle'
export const DEFAULT_TOOL_COLOR = '#5b992e'

export type SavedCell = { id: string; color: string }

const SEED_COLORS: SavedCell[] = [
  { id: '', color: '#4a7a3a' },
  { id: '', color: '#d4b56e' },
  { id: '', color: '#4a7d9d' },
  { id: '', color: '#7a7a7a' },
]

export const useBrushStore = defineStore('brush', () => {
  const tool = ref<Tool>('paint')
  const color = ref(DEFAULT_TOOL_COLOR)
  const savedCells = ref<SavedCell[]>([])

  const registry = createSavedPresetRegistry<{ color: string }>({
    storageKey: 'hexmap.savedCells.v1',
    binding: {
      get: () => savedCells.value,
      set: (next) => { savedCells.value = next },
    },
    validate: (raw) => {
      if (raw && typeof raw === 'object' && typeof (raw as { color?: unknown }).color === 'string') {
        return { color: (raw as { color: string }).color }
      }
      return null
    },
    isDuplicate: (a, b) => a.color === b.color,
    seed: SEED_COLORS.map((c) => ({ color: c.color })),
  })

  function setTool(t: Tool) {
    tool.value = t
  }

  function setColor(c: string) {
    color.value = c
  }

  function loadSavedCells(): void {
    registry.load()
  }

  function saveCurrentCell(): void {
    registry.save({ color: color.value })
  }

  function applySavedCell(id: string): void {
    const cell = registry.find(id)
    if (!cell) return
    color.value = cell.color
  }

  function removeSavedCell(id: string): void {
    registry.remove(id)
  }

  const currentColor = computed(() => color.value)

  return {
    tool,
    color,
    currentColor,
    savedCells,
    setTool,
    setColor,
    loadSavedCells,
    saveCurrentCell,
    applySavedCell,
    removeSavedCell,
  }
})
