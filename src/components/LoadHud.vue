<template>
  <div class="load-hud">
    <ul>
      <li
        v-for="entry in archiveStore.entries"
        :key="entry.id"
        @click="openEntry(entry)"
      >
        <img v-if="entry.thumbnail" :src="'data:image/svg+xml;utf8,' + encodeURIComponent(entry.thumbnail)" alt="" />
        <span>{{ entry.name }}</span>
      </li>
    </ul>
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
