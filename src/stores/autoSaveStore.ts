import { defineStore } from 'pinia'
import { useSessionStore } from './sessionStore'
import { saveWorkspace } from '../storage/persist'
import type { WorkspaceData } from '../storage/persist'

export const useAutoSaveStore = defineStore('autoSave', () => {
  const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function buildWorkspaceSnapshot(): WorkspaceData {
    const sessionStore = useSessionStore()
    return {
      tabs: sessionStore.sessions.map((s) => ({
        id: s.id,
        name: s.name,
        mapData: s.mapData,
      })),
      activeTabId: sessionStore.activeId,
    }
  }

  function scheduleAutoSave(sessionId: string): void {
    const existing = pendingTimers.get(sessionId)
    if (existing !== undefined) {
      clearTimeout(existing)
    }
    const timer = setTimeout(() => {
      pendingTimers.delete(sessionId)
      saveWorkspace(buildWorkspaceSnapshot())
    }, 500)
    pendingTimers.set(sessionId, timer)
  }

  function cancelAutoSave(sessionId: string): void {
    const timer = pendingTimers.get(sessionId)
    if (timer !== undefined) {
      clearTimeout(timer)
      pendingTimers.delete(sessionId)
    }
  }

  function flushAllNow(): void {
    for (const [sessionId, timer] of pendingTimers) {
      clearTimeout(timer)
      pendingTimers.delete(sessionId)
      saveWorkspace(buildWorkspaceSnapshot())
    }
  }

  return { scheduleAutoSave, cancelAutoSave, flushAllNow }
})
