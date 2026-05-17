import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { MapData } from '../data/types'
import type { Command } from '../commands/types'
import { BatchCommand } from '../commands/batchCommand'
import { useSessionStore } from './sessionStore'

const DEFAULT_MAP_DATA: MapData = {
  name: 'New Map',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

export const useMapStore = defineStore('map', () => {
  const mapData = ref<MapData>(structuredClone(DEFAULT_MAP_DATA))
  const undoStack = ref<Command[]>([])
  const redoStack = ref<Command[]>([])

  const pendingInverses = ref<Command[]>([])
  const strokeActive = ref(false)

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  const undoStackLength = computed(() => undoStack.value.length)

  function syncToActiveSession(data: MapData): void {
    const sessionStore = useSessionStore()
    const active = sessionStore.activeSession
    if (!active) return
    active.mapData = data
    sessionStore.markSessionDirty(active.id)
  }

  function dispatch(cmd: Command): void {
    const { state: nextState, inverse } = cmd.apply(mapData.value)
    mapData.value = nextState
    syncToActiveSession(nextState)

    if (strokeActive.value) {
      pendingInverses.value.push(inverse)
    } else {
      undoStack.value.push(inverse)
      redoStack.value = []
    }
  }

  function beginStroke(): void {
    pendingInverses.value = []
    strokeActive.value = true
  }

  function endStroke(): void {
    strokeActive.value = false
    if (pendingInverses.value.length > 0) {
      const batch = new BatchCommand([...pendingInverses.value].reverse())
      undoStack.value.push(batch)
      redoStack.value = []
    }
    pendingInverses.value = []
  }

  function undo(): void {
    const cmd = undoStack.value.pop()
    if (!cmd) return

    const { state: prevState, inverse: forwardCmd } = cmd.apply(mapData.value)
    mapData.value = prevState
    redoStack.value.push(forwardCmd)
    syncToActiveSession(prevState)
  }

  function redo(): void {
    const cmd = redoStack.value.pop()
    if (!cmd) return

    const { state: nextState, inverse: backCmd } = cmd.apply(mapData.value)
    mapData.value = nextState
    undoStack.value.push(backCmd)
    syncToActiveSession(nextState)
  }

  function loadMapData(data: MapData): void {
    mapData.value = structuredClone(toRaw(data))
    undoStack.value = []
    redoStack.value = []
    pendingInverses.value = []
    strokeActive.value = false
  }

  return {
    mapData,
    canUndo,
    canRedo,
    undoStackLength,
    dispatch,
    beginStroke,
    endStroke,
    undo,
    redo,
    loadMapData,
  }
})
