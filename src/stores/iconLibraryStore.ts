import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sanitizeSvgIcon, normalizeSvgIcon } from '../storage/svgNormalize'

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
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function idbGetAll(db: IDBDatabase): Promise<IconEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = (event) =>
      resolve((event as { target: { result: IconEntry[] } }).target.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB getAll failed'))
  })
}

function idbPut(db: IDBDatabase, entry: IconEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(entry)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error ?? new Error('IndexedDB put failed'))
  })
}

function idbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error ?? new Error('IndexedDB delete failed'))
  })
}

export function getDisplaySvg(rawSvg: string): string {
  return normalizeSvgIcon(sanitizeSvgIcon(rawSvg))
}

export const useIconLibraryStore = defineStore('iconLibrary', () => {
  const icons = ref<IconEntry[]>([])
  let db: IDBDatabase | null = null

  async function loadIcons(): Promise<void> {
    db = await openDB()
    icons.value = await idbGetAll(db)
  }

  async function addIcon(rawSvg: string, name: string): Promise<void> {
    const sanitized = sanitizeSvgIcon(rawSvg)
    if (!sanitized) {
      throw new Error('Invalid SVG: sanitization produced empty output')
    }
    if (!db) {
      throw new Error('IconLibraryStore: database not initialized — call loadIcons() first')
    }
    const entry: IconEntry = {
      id: crypto.randomUUID(),
      rawSvg,
      name,
      createdAt: Date.now(),
    }
    await idbPut(db, entry)
    icons.value = [...icons.value, entry]
  }

  async function deleteIcon(id: string): Promise<void> {
    if (!db) {
      throw new Error('IconLibraryStore: database not initialized — call loadIcons() first')
    }
    await idbDelete(db, id)
    icons.value = icons.value.filter((e) => e.id !== id)
  }

  async function updateIcon(id: string, patch: Partial<Omit<IconEntry, 'id'>>): Promise<void> {
    const idx = icons.value.findIndex((e) => e.id === id)
    if (idx === -1) {
      throw new Error(`IconLibraryStore: icon with id "${id}" not found`)
    }
    if (!db) {
      throw new Error('IconLibraryStore: database not initialized — call loadIcons() first')
    }
    const { id: _discardId, ...safePatch } = patch as Partial<IconEntry>
    const updated: IconEntry = { ...icons.value[idx], ...safePatch }
    await idbPut(db, updated)
    icons.value = icons.value.map((e) => (e.id === id ? updated : e))
  }

  return {
    icons,
    loadIcons,
    addIcon,
    deleteIcon,
    updateIcon,
  }
})
