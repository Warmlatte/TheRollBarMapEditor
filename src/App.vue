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
  <div class="relative h-screen w-screen overflow-hidden">
    <HexCanvas class="absolute inset-0" />

    <div class="hud-panel absolute right-2 top-2">
      <div class="flex items-center gap-1.5">
        <span class="flex-1 text-xs font-semibold text-text-dim">{{ activeToolName }}</span>
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
