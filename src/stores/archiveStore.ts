import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MapData } from '../data/types'
import type { Session } from './sessionStore'

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

  async function claimSession(_session: Session): Promise<void> {
    // Implemented in task 6.2
  }

  return {
    entries,
    claimSession,
  }
})
