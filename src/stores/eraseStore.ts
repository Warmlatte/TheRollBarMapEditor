import { defineStore } from 'pinia'
import { ref } from 'vue'

const PREF_KEY = 'hexmap.erase.v1'

function loadPref(): number {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw === null) return 1
    const parsed = JSON.parse(raw) as { radius: number }
    return parsed.radius ?? 1
  } catch {
    return 1
  }
}

function savePref(radius: number): void {
  localStorage.setItem(PREF_KEY, JSON.stringify({ radius }))
}

export const useEraseStore = defineStore('erase', () => {
  const eraseRadius = ref(loadPref())

  function setRadius(r: number): void {
    eraseRadius.value = r
    savePref(eraseRadius.value)
  }

  return { eraseRadius, setRadius }
})
