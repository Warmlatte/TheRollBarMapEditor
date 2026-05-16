import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSessionStore } from './sessionStore'

const PREF_KEY = 'hexmap.line.v1'

type LinePref = { width: number; dashed: boolean }

function loadPref(): LinePref {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw === null) return { width: 2, dashed: false }
    const parsed = JSON.parse(raw) as LinePref
    return { width: parsed.width ?? 2, dashed: parsed.dashed ?? false }
  } catch {
    return { width: 2, dashed: false }
  }
}

function savePref(width: number, dashed: boolean): void {
  localStorage.setItem(PREF_KEY, JSON.stringify({ width, dashed }))
}

export const useLineStore = defineStore('line', () => {
  const pref = loadPref()
  const lineWidth = ref(pref.width)
  const dashed = ref(pref.dashed)
  const pendingAnchor = ref<{ x: number; y: number } | null>(null)
  const previewEnd = ref<{ x: number; y: number } | null>(null)

  const sessionStore = useSessionStore()
  watch(
    () => sessionStore.activeId,
    () => {
      pendingAnchor.value = null
    },
  )

  function setWidth(w: number): void {
    lineWidth.value = w
    savePref(lineWidth.value, dashed.value)
  }

  function setDashed(d: boolean): void {
    dashed.value = d
    savePref(lineWidth.value, dashed.value)
  }

  return { lineWidth, dashed, pendingAnchor, previewEnd, setWidth, setDashed }
})
