<template>
  <div class="load-hud">
    <div class="tile-grid">
      <div
        v-for="entry in archiveStore.entries"
        :key="entry.id"
        class="tile"
        @click="openEntry(entry)"
      >
        <img
          v-if="entry.thumbnail"
          class="tile-thumb"
          :src="'data:image/svg+xml;utf8,' + encodeURIComponent(entry.thumbnail)"
          alt=""
        />
        <div v-else class="tile-thumb tile-thumb-empty" />
        <span class="tile-name">{{ entry.name }}</span>
        <button
          class="tile-delete"
          title="刪除"
          @click.stop="archiveStore.deleteEntry(entry.id)"
        >✕</button>
      </div>
    </div>
    <p v-if="archiveStore.entries.length === 0" class="empty-hint">尚無儲存地圖</p>
  </div>
</template>

<script setup lang="ts">
import { useArchiveStore } from '../stores/archiveStore'
import { useSessionStore } from '../stores/sessionStore'
import type { ArchiveEntry } from '../stores/archiveStore'

const archiveStore = useArchiveStore()
const sessionStore = useSessionStore()

function openEntry(entry: ArchiveEntry): void {
  sessionStore.createSessionFromArchive(entry)
}
</script>

<style scoped>
.load-hud {
  position: absolute;
  top: 50px;
  left: 8px;
  width: 264px;
  max-height: calc(100vh - 80px);
  overflow-y: scroll;
  overflow-x: hidden;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 6px;
  font-size: 13px;
  color: #ddd;
  backdrop-filter: blur(4px);
  padding: 10px 12px;
  z-index: 10;
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}

.tile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tile {
  position: relative;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}
.tile:hover { border-color: #666; }

.tile-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}
.tile-thumb-empty {
  background: #222;
}

.tile-name {
  display: block;
  padding: 4px 6px;
  font-size: 11px;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #333;
  border: none;
  border-radius: 3px;
  color: #aaa;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.tile:hover .tile-delete { opacity: 1; }
.tile-delete:hover { background: #8a3a2e; color: #fff; }

.empty-hint {
  color: #666;
  font-size: 12px;
  text-align: center;
  margin: 8px 0 0;
}
</style>
