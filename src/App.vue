<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import FloatingToolbar from './components/FloatingToolbar.vue'
import HexCanvas from './render/HexCanvas.vue'
import { TOOLS } from './tools/registry'
import { useBrushStore } from './stores/brushStore'
import { useMapStore } from './stores/mapStore'
import { useAutoSaveStore } from './stores/autoSaveStore'
import { useSessionStore } from './stores/sessionStore'
import { useI18nStore } from './stores/i18nStore'
import { loadWorkspace } from './storage/persist'
import { loadHandle } from './storage/fileHandlePersistence'

const brushStore = useBrushStore()
const mapStore = useMapStore()
const i18n = useI18nStore()
const activeTool = computed(() => TOOLS.find(t => t.id === brushStore.tool))
const activeHud = computed(() => activeTool.value?.hud)
const activeToolName = computed(() => i18n.t(activeTool.value?.i18nKey ?? ''))

const autoSaveStore = useAutoSaveStore()
const sessionStore = useSessionStore()

function syncActiveSessionMapData(): void {
  const activeSession = sessionStore.activeSession
  if (!activeSession) return
  mapStore.loadMapData(activeSession.mapData)
}

watch(
  () => sessionStore.activeId,
  () => syncActiveSessionMapData(),
)

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

  // Load active session's map data into mapStore so the canvas renders it.
  syncActiveSessionMapData()

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
  <div style="position: relative; width: 100vw; height: 100vh; overflow: hidden;">
    <HexCanvas style="position: absolute; inset: 0;" />

    <div class="hud-panel">
      <div class="hud-header">
        <span class="hud-tool-name">{{ activeToolName }}</span>
        <button class="hud-btn" :disabled="!mapStore.canUndo" @click="mapStore.undo()">↩</button>
        <button class="hud-btn" :disabled="!mapStore.canRedo" @click="mapStore.redo()">↪</button>
      </div>
      <hr class="hud-divider" />
      <component :is="activeHud" v-if="activeHud" />
    </div>

    <button class="settings-btn">⚙</button>

    <FloatingToolbar />
  </div>
</template>

<style>
.hud-panel {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 264px;
  max-height: calc(100vh - 80px);
  overflow-y: scroll;
  overflow-x: hidden;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 6px;
  font-size: 13px;
  color: #ddd;
  backdrop-filter: blur(4px);
  z-index: 10;
  padding: 10px 12px;
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}

.hud-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hud-tool-name {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #ddd;
}

.settings-btn {
  position: absolute;
  bottom: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.65);
  border: 1px solid #555;
  color: #ddd;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
</style>
