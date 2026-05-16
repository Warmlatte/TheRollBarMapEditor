import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useIconStore = defineStore('icon', () => {
  const selectedSvg = ref<string | null>(null)
  const iconSize = ref(1)
  const iconRotation = ref(0)

  return { selectedSvg, iconSize, iconRotation }
})
