import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSessionStore } from './sessionStore'

export const useLineStore = defineStore('line', () => {
  const lineWidth = ref(2)
  const dashed = ref(false)
  const pendingAnchor = ref<{ x: number; y: number } | null>(null)
  const previewEnd = ref<{ x: number; y: number } | null>(null)

  const sessionStore = useSessionStore()
  watch(
    () => sessionStore.activeId,
    () => {
      pendingAnchor.value = null
    },
  )

  return { lineWidth, dashed, pendingAnchor, previewEnd }
})
