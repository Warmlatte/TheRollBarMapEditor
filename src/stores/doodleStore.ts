import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDoodleStore = defineStore('doodle', () => {
  const doodleWidth = ref(3)
  const doodleOpacity = ref(1)
  const pendingStroke = ref<Array<{ x: number; y: number }>>([])

  return { doodleWidth, doodleOpacity, pendingStroke }
})
