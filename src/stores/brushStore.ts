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

  return { tool, color, setTool, setColor }
})
