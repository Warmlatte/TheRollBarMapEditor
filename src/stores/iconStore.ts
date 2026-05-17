import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useIconStore = defineStore('icon', () => {
  const selectedSvgId = ref<string | null>(null)
  const size = ref(40)
  const rotation = ref(0)
  const color = ref('#000000')

  function setSelectedSvgId(id: string | null): void {
    selectedSvgId.value = id
  }

  function setSize(s: number): void {
    size.value = s
  }

  function setRotation(r: number): void {
    rotation.value = r
  }

  function setColor(c: string): void {
    color.value = c
  }

  return { selectedSvgId, size, rotation, color, setSelectedSvgId, setSize, setRotation, setColor }
})
