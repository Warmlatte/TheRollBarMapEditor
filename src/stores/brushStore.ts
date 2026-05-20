import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Tool = 'paint' | 'erase' | 'icon' | 'line' | 'doodle'
export const DEFAULT_TOOL_COLOR = '#5b992e'

export const useBrushStore = defineStore('brush', () => {
  const tool = ref<Tool>('paint')
  const color = ref(DEFAULT_TOOL_COLOR)

  function setTool(t: Tool) {
    tool.value = t
  }

  function setColor(c: string) {
    color.value = c
  }

  const savedCells = ref<string[]>([])

  function saveCurrentCell(): void {
    if (!savedCells.value.includes(color.value)) {
      savedCells.value = [...savedCells.value, color.value]
    }
  }

  const currentColor = computed(() => color.value)

  return { tool, color, currentColor, savedCells, setTool, setColor, saveCurrentCell }
})
