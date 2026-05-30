import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const PREF_KEY = 'hexmap.erase.v1'
const DEFAULT_RADIUS = 5
const MIN_RADIUS = 5
const MAX_RADIUS = 200

type EraseTarget = 'hex' | 'icon' | 'line' | 'doodle'
type EraseTargets = Record<EraseTarget, boolean>

const DEFAULT_TARGETS: EraseTargets = {
  hex: true,
  icon: true,
  line: true,
  doodle: true,
}

type ErasePref = {
  radius: number
  targets: EraseTargets
}

function clampRadius(radius: number): number {
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius))
}

function defaultTargets(): EraseTargets {
  return { ...DEFAULT_TARGETS }
}

function normalizeTargets(targets: unknown): EraseTargets {
  if (targets === null || typeof targets !== 'object') return defaultTargets()
  const stored = targets as Partial<Record<EraseTarget, unknown>>
  return {
    hex: typeof stored.hex === 'boolean' ? stored.hex : true,
    icon: typeof stored.icon === 'boolean' ? stored.icon : true,
    line: typeof stored.line === 'boolean' ? stored.line : true,
    doodle: typeof stored.doodle === 'boolean' ? stored.doodle : true,
  }
}

function loadPref(): ErasePref {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw === null) return { radius: DEFAULT_RADIUS, targets: defaultTargets() }
    const parsed = JSON.parse(raw) as { radius?: unknown; targets?: unknown }
    const radius = typeof parsed.radius === 'number'
      ? clampRadius(parsed.radius)
      : DEFAULT_RADIUS
    return {
      radius,
      targets: normalizeTargets(parsed.targets),
    }
  } catch {
    return { radius: DEFAULT_RADIUS, targets: defaultTargets() }
  }
}

function savePref(radius: number, targets: EraseTargets): void {
  localStorage.setItem(PREF_KEY, JSON.stringify({ radius, targets }))
}

export const useEraseStore = defineStore('erase', () => {
  const pref = loadPref()
  const eraseRadius = ref(pref.radius)
  const targets = ref<EraseTargets>(pref.targets)

  function setRadius(r: number): void {
    eraseRadius.value = clampRadius(r)
    savePref(eraseRadius.value, targets.value)
  }

  function toggleTarget(key: EraseTarget): void {
    targets.value = { ...targets.value, [key]: !targets.value[key] }
    savePref(eraseRadius.value, targets.value)
  }

  function selectAllTargets(): void {
    targets.value = defaultTargets()
    savePref(eraseRadius.value, targets.value)
  }

  const radius = computed(() => eraseRadius.value)

  return { eraseRadius, radius, targets, setRadius, toggleTarget, selectAllTargets }
})
