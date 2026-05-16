import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useViewportStore = defineStore('viewport', () => {
  const panX = ref(0)
  const panY = ref(0)
  const zoom = ref(1)

  const viewBox = computed(() => ({
    x: panX.value,
    y: panY.value,
    zoom: zoom.value,
  }))

  function setPan(x: number, y: number) {
    panX.value = x
    panY.value = y
  }

  function setZoom(z: number) {
    zoom.value = Math.max(0.1, Math.min(10, z))
  }

  return { panX, panY, zoom, viewBox, setPan, setZoom }
})
