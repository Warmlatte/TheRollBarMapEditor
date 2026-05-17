import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Tool = 'paint' | 'erase' | 'icon' | 'line' | 'doodle'

export const useBrushStore = defineStore('brush', () => {
  const tool = ref<Tool>('paint')
  const color = ref('#6366f1')

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

  return { tool, color, savedCells, setTool, setColor, saveCurrentCell }
})
