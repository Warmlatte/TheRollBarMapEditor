import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSessionStore } from './sessionStore'

const PREF_KEY = 'hexmap.line.v1'
const SAVED_LINES_KEY = 'hexmap.savedLines.v1'

export type SavedLine = {
  id: string
  color: string
  width: number
  dashed: boolean
  dashLength: number
  dashGap: number
}

type LinePref = { width: number; dashed: boolean; dashLength: number; dashGap: number }

const DEFAULT_SEEDS: SavedLine[] = [
  { id: 'seed-1', color: '#222222', width: 4, dashed: false, dashLength: 5, dashGap: 5 },
  { id: 'seed-2', color: '#7a4a2a', width: 2, dashed: true,  dashLength: 4, dashGap: 4 },
  { id: 'seed-3', color: '#4a7d9d', width: 3, dashed: false, dashLength: 5, dashGap: 5 },
  { id: 'seed-4', color: '#a23232', width: 3, dashed: true,  dashLength: 8, dashGap: 4 },
]

function loadPref(): LinePref {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw === null) return { width: 2, dashed: false, dashLength: 8, dashGap: 4 }
    const parsed = JSON.parse(raw) as Partial<LinePref>
    return {
      width: parsed.width ?? 2,
      dashed: parsed.dashed ?? false,
      dashLength: parsed.dashLength ?? 8,
      dashGap: parsed.dashGap ?? 4,
    }
  } catch {
    return { width: 2, dashed: false, dashLength: 8, dashGap: 4 }
  }
}

function savePref(width: number, dashed: boolean, dashLength: number, dashGap: number): void {
  localStorage.setItem(PREF_KEY, JSON.stringify({ width, dashed, dashLength, dashGap }))
}

function loadSavedLines(): SavedLine[] {
  try {
    const raw = localStorage.getItem(SAVED_LINES_KEY)
    if (raw === null) return [...DEFAULT_SEEDS]
    return JSON.parse(raw) as SavedLine[]
  } catch {
    return [...DEFAULT_SEEDS]
  }
}

function persistSavedLines(lines: SavedLine[]): void {
  localStorage.setItem(SAVED_LINES_KEY, JSON.stringify(lines))
}

export const useLineStore = defineStore('line', () => {
  const pref = loadPref()
  const lineWidth = ref(pref.width)
  const dashed = ref(pref.dashed)
  const dashLength = ref(pref.dashLength)
  const dashGap = ref(pref.dashGap)
  const pendingAnchor = ref<{ x: number; y: number } | null>(null)
  const previewEnd = ref<{ x: number; y: number } | null>(null)
  const savedLines = ref<SavedLine[]>(loadSavedLines())

  const sessionStore = useSessionStore()
  watch(
    () => sessionStore.activeId,
    () => {
      pendingAnchor.value = null
    },
  )

  function setWidth(w: number): void {
    lineWidth.value = w
    savePref(lineWidth.value, dashed.value, dashLength.value, dashGap.value)
  }

  function setDashed(d: boolean): void {
    dashed.value = d
    savePref(lineWidth.value, dashed.value, dashLength.value, dashGap.value)
  }

  function setDashLength(v: number): void {
    dashLength.value = Math.min(40, Math.max(1, v))
    savePref(lineWidth.value, dashed.value, dashLength.value, dashGap.value)
  }

  function setDashGap(v: number): void {
    dashGap.value = Math.min(40, Math.max(1, v))
    savePref(lineWidth.value, dashed.value, dashLength.value, dashGap.value)
  }

  function saveCurrentLine(color: string): string {
    const existing = savedLines.value.find(
      s =>
        s.color === color &&
        s.width === lineWidth.value &&
        s.dashed === dashed.value &&
        s.dashLength === dashLength.value &&
        s.dashGap === dashGap.value,
    )
    if (existing) return existing.id

    const id = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const entry: SavedLine = {
      id,
      color,
      width: lineWidth.value,
      dashed: dashed.value,
      dashLength: dashLength.value,
      dashGap: dashGap.value,
    }
    savedLines.value = [...savedLines.value, entry]
    persistSavedLines(savedLines.value)
    return id
  }

  function removeSavedLine(id: string): void {
    savedLines.value = savedLines.value.filter(s => s.id !== id)
    persistSavedLines(savedLines.value)
  }

  function applySavedLine(id: string): SavedLine | null {
    const entry = savedLines.value.find(s => s.id === id)
    if (!entry) return null
    lineWidth.value = entry.width
    dashed.value = entry.dashed
    dashLength.value = entry.dashLength
    dashGap.value = entry.dashGap
    savePref(lineWidth.value, dashed.value, dashLength.value, dashGap.value)
    return entry
  }

  return {
    lineWidth,
    dashed,
    dashLength,
    dashGap,
    pendingAnchor,
    previewEnd,
    savedLines,
    setWidth,
    setDashed,
    setDashLength,
    setDashGap,
    saveCurrentLine,
    removeSavedLine,
    applySavedLine,
  }
})
