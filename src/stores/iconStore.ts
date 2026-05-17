import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useIconStore = defineStore('icon', () => {
  const selectedSvg = ref<string | null>(null)
  const iconSize = ref(40)
  const iconRotation = ref(0)

  function setSize(s: number): void {
    iconSize.value = s
  }

  function setRotation(r: number): void {
    iconRotation.value = r
  }

  return { selectedSvg, iconSize, iconRotation, setSize, setRotation }
})
