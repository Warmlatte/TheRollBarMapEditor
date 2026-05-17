<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import FloatingToolbar from './components/FloatingToolbar.vue'
import HexCanvas from './render/HexCanvas.vue'
import { TOOLS } from './tools/registry'
import { useBrushStore } from './stores/brushStore'
import { useMapStore } from './stores/mapStore'
import { useAutoSaveStore } from './stores/autoSaveStore'
import { useSessionStore } from './stores/sessionStore'
import { loadWorkspace } from './storage/persist'
import { loadHandle } from './storage/fileHandlePersistence'

const brushStore = useBrushStore()
const mapStore = useMapStore()
const activeHud = computed(() => TOOLS.find(t => t.id === brushStore.tool)?.hud)

const autoSaveStore = useAutoSaveStore()
const sessionStore = useSessionStore()

function handleKeyDown(e: KeyboardEvent): void {
  const mod = e.metaKey || e.ctrlKey
  if (!mod) return
  if (e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    mapStore.undo()
  } else if (e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    mapStore.redo()
  } else if (e.key === 'y') {
    e.preventDefault()
    mapStore.redo()
  }
}

function handleBeforeUnload(): void {
  autoSaveStore.flushAllNow()
}

async function restoreWorkspace(): Promise<void> {
  const workspace = loadWorkspace()
  if (!workspace || workspace.tabs.length === 0) {
    // No saved workspace — create a fresh session so autosave has a target
    const session = sessionStore.makeSession()
    sessionStore.setActive(session.id)
    return
  }

  // Replace any startup placeholder sessions without triggering closeSession's
  // last-session replacement behavior.
  sessionStore.sessions.splice(0, sessionStore.sessions.length)

  // Restore sessions from workspace tabs, preserving IDs
  for (const tab of workspace.tabs) {
    const session = sessionStore.makeSession(tab.mapData)
    session.id = tab.id
    session.name = tab.name
  }

  if (workspace.activeTabId) {
    sessionStore.setActive(workspace.activeTabId)
  } else if (sessionStore.sessions.length > 0) {
    sessionStore.setActive(sessionStore.sessions[0].id)
  }

  // Load active session's map data into mapStore so the canvas renders it
  const activeSession = sessionStore.activeSession
  if (activeSession) {
    mapStore.loadMapData(activeSession.mapData)
  }

  // Restore file handles for each session (no requestPermission — deferred to save time)
  for (const session of sessionStore.sessions) {
    const handle = await loadHandle(session.id)
    if (handle) {
      session.fileHandle = handle
    }
  }
}

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('keydown', handleKeyDown)
  await restoreWorkspace()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white" style="position: relative; overflow: hidden;">
    <HexCanvas style="position: absolute; inset: 0;" />
    <div class="hud-panel">
      <component :is="activeHud" v-if="activeHud" />
    </div>
    <FloatingToolbar />
  </div>
</template>

<style>
.hud-panel {
  position: fixed;
  top: 16px;
  left: 16px;
  width: 220px;
  background: rgba(30, 30, 40, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  z-index: 10;
}
</style>
