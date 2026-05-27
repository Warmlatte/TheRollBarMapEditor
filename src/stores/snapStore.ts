import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SnapMode = 'free' | 'node'

const PREF_KEY = 'hexmap.snap.v1'

function loadPref(): SnapMode {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw === null) return 'free'
    const parsed = JSON.parse(raw) as { mode: SnapMode }
    return parsed.mode === 'node' ? 'node' : 'free'
  } catch {
    return 'free'
  }
}

function savePref(mode: SnapMode): void {
  localStorage.setItem(PREF_KEY, JSON.stringify({ mode }))
}

export const useSnapStore = defineStore('snap', () => {
  const snapMode = ref<SnapMode>(loadPref())

  function setMode(mode: SnapMode): void {
    snapMode.value = mode
    savePref(snapMode.value)
  }

  return { snapMode, setMode }
})
