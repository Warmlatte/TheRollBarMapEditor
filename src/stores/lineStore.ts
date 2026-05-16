import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLineStore = defineStore('line', () => {
  const lineWidth = ref(2)
  const dashed = ref(false)
  const pendingAnchor = ref<{ x: number; y: number } | null>(null)
  const previewEnd = ref<{ x: number; y: number } | null>(null)

  return { lineWidth, dashed, pendingAnchor, previewEnd }
})
