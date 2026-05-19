import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ICON_PATHS } from '../assets/iconPaths'
import { sanitizeSvgIcon, normalizeSvgIcon } from '../storage/svgNormalize'

export type IconEntry = {
  id: string
  rawSvg: string
  name: string
  createdAt: number
  defaultColor?: string
}

const DEFAULT_ICON_COLORS: Record<string, string> = {
  mountain: '#7a7a7a',
  tree: '#4a7a3a',
  tower: '#7a4a2a',
  skull: '#c33232',
}

const DB_NAME = 'hexmap'
const STORE_NAME = 'icons'
const DB_VERSION = 1
const DEFAULT_SEEDS: ReadonlyArray<{ id: string; name: string; rawSvg: string; defaultColor?: string }> =
  Object.entries(ICON_PATHS).map(([id, path]) => ({
    id,
    name: id,
    rawSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${path}</svg>`,
    defaultColor: DEFAULT_ICON_COLORS[id],
  }))

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

function sortIconEntries(entries: IconEntry[]): IconEntry[] {
  return [...entries].sort((a, b) => {
    const aIdx = DEFAULT_SEEDS.findIndex((seed) => seed.id === a.id)
    const bIdx = DEFAULT_SEEDS.findIndex((seed) => seed.id === b.id)
    if (aIdx !== -1 || bIdx !== -1) {
      return (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) -
        (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx)
    }
    return a.createdAt - b.createdAt
  })
}

export const useIconLibraryStore = defineStore('iconLibrary', () => {
  const icons = ref<IconEntry[]>([])
  let db: IDBDatabase | null = null

  async function loadIcons(): Promise<void> {
    db = await openDB()
    const loaded = await idbGetAll(db)
    if (loaded.length === 0) {
      const seeded = DEFAULT_SEEDS.map((seed, index) => ({
        id: seed.id,
        rawSvg: seed.rawSvg,
        name: seed.name,
        createdAt: index + 1,
        defaultColor: seed.defaultColor,
      }))
      for (const entry of seeded) {
        await idbPut(db, entry)
      }
      icons.value = seeded
      return
    }
    icons.value = sortIconEntries(loaded)
  }

  async function addIcon(rawSvg: string, name: string): Promise<void> {
    let sanitized: string
    try {
      sanitized = sanitizeSvgIcon(rawSvg)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid SVG: ${message}`)
    }
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
