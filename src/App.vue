<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import FloatingToolbar from './components/FloatingToolbar.vue'
import { TOOLS } from './tools/registry'
import { useBrushStore } from './stores/brushStore'
import { useAutoSaveStore } from './stores/autoSaveStore'
import { useSessionStore } from './stores/sessionStore'
import { loadWorkspace } from './storage/persist'
import { loadHandle } from './storage/fileHandlePersistence'

const brushStore = useBrushStore()
const activeHud = computed(() => TOOLS.find(t => t.id === brushStore.tool)?.hud)

const autoSaveStore = useAutoSaveStore()
const sessionStore = useSessionStore()

function handleBeforeUnload(): void {
  autoSaveStore.flushAllNow()
}

async function restoreWorkspace(): Promise<void> {
  const workspace = loadWorkspace()
  if (!workspace || workspace.tabs.length === 0) return

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
  await restoreWorkspace()
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
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
