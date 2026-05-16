import type { MapData } from '@/data/types'

export type WorkspaceTab = {
  id: string
  name: string
  mapData: MapData
}

export type WorkspaceData = {
  tabs: WorkspaceTab[]
  activeTabId: string | null
}

const WORKSPACE_KEY = 'hexmap.workspace.v1'
const WORKSPACE_BAK_KEY = 'hexmap.workspace.v1.bak'

export function saveWorkspace(data: WorkspaceData): void {
  const json = JSON.stringify(data)
  localStorage.setItem(WORKSPACE_BAK_KEY, json)
  localStorage.setItem(WORKSPACE_KEY, json)
}

export function loadWorkspace(): WorkspaceData | null {
  const tryParse = (raw: string | null): WorkspaceData | null => {
    if (raw === null) return null
    try {
      return JSON.parse(raw) as WorkspaceData
    } catch {
      return null
    }
  }

  return tryParse(localStorage.getItem(WORKSPACE_KEY)) ?? tryParse(localStorage.getItem(WORKSPACE_BAK_KEY))
}
