import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MapData } from '../data/types'

export type ArchiveEntry = {
  id: string
  name: string
  mapData: MapData
  fileHandle: FileSystemFileHandle | string | null
  order: number
  thumbnail?: string
}

export const useArchiveStore = defineStore('archive', () => {
  const entries = ref<ArchiveEntry[]>([])

  return {
    entries,
  }
})
