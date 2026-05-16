import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MapData } from '../data/types'
import type { Command } from '../commands/types'

export type Session = {
  id: string
  name: string
  mapData: MapData
  fileHandle: FileSystemFileHandle | string | null
  undoStack: Command[]
  redoStack: Command[]
  isDirty: boolean
}

const DEFAULT_MAP_DATA: MapData = {
  name: 'New Map',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<Session[]>([])
  const activeId = ref<string | null>(null)

  const activeSession = computed(() =>
    sessions.value.find((s) => s.id === activeId.value) ?? null,
  )

  return {
    sessions,
    activeId,
    activeSession,
  }
})
