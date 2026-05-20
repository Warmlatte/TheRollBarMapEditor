import { defineStore } from 'pinia'
import { ref } from 'vue'
import DOMPurify from 'dompurify'
import type { MapData } from '../data/types'
import type { Session } from './sessionStore'
import { exportRender } from '../storage/exportRender'

export type ArchiveEntry = {
  id: string
  name: string
  mapData: MapData
  fileHandle: FileSystemFileHandle | string | null
  order: number
  thumbnail?: string
}

const DB_NAME = 'hexmap.archive'
const STORE_NAME = 'entries'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = () => reject(request.error)
  })
}

function idbPut(db: IDBDatabase, entry: ArchiveEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(entry)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function idbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function idbGetAll(db: IDBDatabase): Promise<ArchiveEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = (event) =>
      resolve((event.target as IDBRequest<ArchiveEntry[]>).result)
    req.onerror = () => reject(req.error)
  })
}

export const useArchiveStore = defineStore('archive', () => {
  const entries = ref<ArchiveEntry[]>([])
  let db: IDBDatabase | null = null

  async function loadArchive(): Promise<void> {
    try {
      db = await openDB()
      const all = await idbGetAll(db)
      entries.value = all.sort((a, b) => a.order - b.order)
    } catch {
      entries.value = []
    }
  }

  async function claimSession(session: Session): Promise<void> {
    const maxOrder =
      entries.value.length > 0 ? Math.max(...entries.value.map((e) => e.order)) : 0

    let thumbnail: string | undefined
    try {
      const svg = exportRender(session.mapData)
      thumbnail = DOMPurify.sanitize(svg)
    } catch {
      thumbnail = undefined
    }

    const existing = entries.value.find((e) => e.id === session.id)
    if (existing) {
      existing.name = session.name
      existing.mapData = session.mapData
      existing.thumbnail = thumbnail
      if (db) await idbPut(db, existing)
    } else {
      const entry: ArchiveEntry = {
        id: session.id,
        name: session.name,
        mapData: session.mapData,
        fileHandle: session.fileHandle,
        order: maxOrder + 1,
        thumbnail,
      }
      entries.value.push(entry)
      if (db) await idbPut(db, entry)
    }
  }

  async function deleteEntry(id: string): Promise<void> {
    const idx = entries.value.findIndex((e) => e.id === id)
    if (idx === -1) return
    entries.value.splice(idx, 1)
    if (db) await idbDelete(db, id)
  }

  async function moveArchiveEntry(id: string, targetIndex: number): Promise<void> {
    const sorted = [...entries.value].sort((a, b) => a.order - b.order)
    const fromIdx = sorted.findIndex((e) => e.id === id)
    if (fromIdx === -1) return

    // Remove from sorted and re-insert at target
    const [moving] = sorted.splice(fromIdx, 1)
    sorted.splice(targetIndex, 0, moving)

    // Compute fractional order: midpoint between neighbours
    const prev = sorted[targetIndex - 1]?.order ?? 0
    const next = sorted[targetIndex + 1]?.order ?? (prev + 2)
    moving.order = (prev + next) / 2

    entries.value = [...sorted]
    if (db) await idbPut(db, moving)
  }

  return {
    entries,
    loadArchive,
    claimSession,
    deleteEntry,
    moveArchiveEntry,
  }
})
