import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sanitizeSvgIcon } from '../storage/svgNormalize'

export type IconEntry = {
  id: string
  rawSvg: string
  name: string
  createdAt: number
}

const DB_NAME = 'hexmap'
const STORE_NAME = 'icons'
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

function idbGetAll(db: IDBDatabase): Promise<IconEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = (event) =>
      resolve((event as { target: { result: IconEntry[] } }).target.result)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, entry: IconEntry): Promise<void> {
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

export const useIconLibraryStore = defineStore('iconLibrary', () => {
  const icons = ref<IconEntry[]>([])
  let db: IDBDatabase | null = null

  async function loadIcons(): Promise<void> {
    try {
      db = await openDB()
      icons.value = await idbGetAll(db)
    } catch {
      icons.value = []
    }
  }

  async function addIcon(rawSvg: string, name: string): Promise<void> {
    sanitizeSvgIcon(rawSvg)
    const entry: IconEntry = {
      id: crypto.randomUUID(),
      rawSvg,
      name,
      createdAt: Date.now(),
    }
    icons.value = [...icons.value, entry]
    try {
      if (db) await idbPut(db, entry)
    } catch {
      // silently fail
    }
  }

  async function deleteIcon(id: string): Promise<void> {
    icons.value = icons.value.filter((e) => e.id !== id)
    try {
      if (db) await idbDelete(db, id)
    } catch {
      // silently fail
    }
  }

  async function updateIcon(id: string, patch: Partial<Omit<IconEntry, 'id'>>): Promise<void> {
    const idx = icons.value.findIndex((e) => e.id === id)
    if (idx === -1) return
    const updated = { ...icons.value[idx], ...patch }
    icons.value = icons.value.map((e) => (e.id === id ? updated : e))
    try {
      if (db) await idbPut(db, updated)
    } catch {
      // silently fail
    }
  }

  return {
    icons,
    loadIcons,
    addIcon,
    deleteIcon,
    updateIcon,
  }
})
