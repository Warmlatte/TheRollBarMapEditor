import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSessionStore } from './sessionStore'

const PREF_KEY = 'hexmap.doodle.v1'

type DoodlePref = { width: number; opacity: number }

function loadPref(): DoodlePref {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw === null) return { width: 3, opacity: 1 }
    const parsed = JSON.parse(raw) as DoodlePref
    return { width: parsed.width ?? 3, opacity: parsed.opacity ?? 1 }
  } catch {
    return { width: 3, opacity: 1 }
  }
}

function savePref(width: number, opacity: number): void {
  localStorage.setItem(PREF_KEY, JSON.stringify({ width, opacity }))
}

export const useDoodleStore = defineStore('doodle', () => {
  const pref = loadPref()
  const doodleWidth = ref(pref.width)
  const doodleOpacity = ref(pref.opacity)
  const pendingStroke = ref<Array<{ x: number; y: number }>>([])

  const sessionStore = useSessionStore()
  watch(
    () => sessionStore.activeId,
    () => {
      pendingStroke.value = []
    },
  )

  function setWidth(w: number): void {
    doodleWidth.value = w
    savePref(doodleWidth.value, doodleOpacity.value)
  }

  function setOpacity(o: number): void {
    doodleOpacity.value = o
    savePref(doodleWidth.value, doodleOpacity.value)
  }

  return { doodleWidth, doodleOpacity, pendingStroke, setWidth, setOpacity }
})
