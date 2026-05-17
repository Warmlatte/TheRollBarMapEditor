import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MapData } from '../data/types'
import type { Command } from '../commands/types'
import { useArchiveStore } from './archiveStore'
import type { ArchiveEntry } from './archiveStore'
import { useToastStore } from './toastStore'
import { useAutoSaveStore } from './autoSaveStore'
import { fileLock } from '../lib/fileLock'
import { saveHandle } from '../storage/fileHandlePersistence'

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
  bounds: { radius: 10 },
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
    const autoSaveStore = useAutoSaveStore()
    autoSaveStore.scheduleAutoSave(id)
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
    const session = sessions.value[idx]
    if (session.fileHandle !== null) {
      const fileId =
        typeof session.fileHandle === 'string'
          ? session.fileHandle
          : session.fileHandle.name
      fileLock.broadcastUnlock(fileId)
    }
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

  async function createSessionFromFile(
    mapData: MapData,
    handle: FileSystemFileHandle | string,
  ): Promise<Session | null> {
    const fileId = typeof handle === 'string' ? handle : handle.name

    // Same handle already open in this tab → switch to it
    const existing = sessions.value.find((s) => s.fileHandle === handle)
    if (existing) {
      setActive(existing.id)
      return existing
    }

    // Locked by another tab
    if (fileLock.isLockedByOtherTab(fileId)) {
      const toastStore = useToastStore()
      toastStore.push(
        `此檔案已在另一個視窗開啟：${fileId}`,
        'warn',
      )
      return null
    }

    const session = makeSession(mapData)
    session.fileHandle = handle
    setActive(session.id)
    await saveHandle(session.id, typeof handle === 'string' ? null : handle)
    fileLock.broadcastLock(fileId)
    return session
  }

  function createSessionFromArchive(entry: ArchiveEntry): Session {
    const existing = sessions.value.find((s) => s.id === entry.id)
    if (existing) {
      setActive(existing.id)
      return existing
    }
    const newSession = makeSession(entry.mapData)
    // Force the archive entry's ID so the record isn't duplicated
    newSession.id = entry.id
    setActive(newSession.id)
    return newSession
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
    createSessionFromFile,
    createSessionFromArchive,
  }
})
