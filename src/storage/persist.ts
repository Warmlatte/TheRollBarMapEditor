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

function isValidWorkspace(obj: unknown): obj is WorkspaceData {
  return typeof obj === 'object' && obj !== null && Array.isArray((obj as Record<string, unknown>).tabs)
}

export function loadWorkspace(): WorkspaceData | null {
  const tryParse = (raw: string | null): WorkspaceData | null => {
    if (raw === null) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      return isValidWorkspace(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return tryParse(localStorage.getItem(WORKSPACE_KEY)) ?? tryParse(localStorage.getItem(WORKSPACE_BAK_KEY))
}
