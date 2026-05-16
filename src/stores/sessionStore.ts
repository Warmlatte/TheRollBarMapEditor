import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MapData } from '../data/types'
import type { Command } from '../commands/types'
import { useArchiveStore } from './archiveStore'

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

  function setActive(id: string): void {
    activeId.value = id
  }

  function markSessionDirty(id: string): void {
    const session = sessions.value.find((s) => s.id === id)
    if (!session) return
    session.isDirty = true
    const archiveStore = useArchiveStore()
    archiveStore.claimSession(session)
  }

  function renameSession(id: string, name: string): void {
    const session = sessions.value.find((s) => s.id === id)
    if (!session) return
    session.name = name
    markSessionDirty(id)
  }

  function closeSession(id: string): void {
    const idx = sessions.value.findIndex((s) => s.id === id)
    if (idx === -1) return
    sessions.value.splice(idx, 1)
    if (sessions.value.length === 0) {
      makeSession()
    }
  }

  function makeSession(initialMapData?: MapData): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      name: initialMapData?.name ?? 'New Map',
      mapData: initialMapData
        ? structuredClone(initialMapData)
        : structuredClone(DEFAULT_MAP_DATA),
      fileHandle: null,
      undoStack: [],
      redoStack: [],
      isDirty: false,
    }
    sessions.value.push(session)
    return session
  }

  return {
    sessions,
    activeId,
    activeSession,
    makeSession,
    closeSession,
    setActive,
    renameSession,
    markSessionDirty,
  }
})
