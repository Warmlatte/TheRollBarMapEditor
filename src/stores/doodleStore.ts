import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSessionStore } from './sessionStore'

export const useDoodleStore = defineStore('doodle', () => {
  const doodleWidth = ref(3)
  const doodleOpacity = ref(1)
  const pendingStroke = ref<Array<{ x: number; y: number }>>([])

  const sessionStore = useSessionStore()
  watch(
    () => sessionStore.activeId,
    () => {
      pendingStroke.value = []
    },
  )

  return { doodleWidth, doodleOpacity, pendingStroke }
})
