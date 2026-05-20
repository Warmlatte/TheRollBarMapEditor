import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { toRaw } from 'vue'
import { useMapStore } from '../mapStore'
import { useSessionStore } from '../sessionStore'
import { PaintHexCommand } from '../../commands/hexCommands'
import type { MapData } from '../../data/types'

describe('mapStore skeleton', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('canUndo is false initially', () => {
    const store = useMapStore()
    expect(store.canUndo).toBe(false)
  })

  it('canRedo is false initially', () => {
    const store = useMapStore()
    expect(store.canRedo).toBe(false)
  })

  it('mapData has expected shape initially', () => {
    const store = useMapStore()
    expect(store.mapData).toMatchObject({
      hexes: expect.any(Array),
      icons: expect.any(Array),
      lines: expect.any(Array),
      doodles: expect.any(Array),
      bounds: expect.any(Object),
    })
  })
})

describe('mapStore.dispatch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('dispatch produces a new mapData reference', () => {
    const store = useMapStore()
    const before = store.mapData
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    store.dispatch(cmd)
    expect(store.mapData).not.toBe(before)
  })

  it('canUndo is true after dispatch', () => {
    const store = useMapStore()
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    store.dispatch(cmd)
    expect(store.canUndo).toBe(true)
  })

  it('canRedo is false after dispatch', () => {
    const store = useMapStore()
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    store.dispatch(cmd)
    expect(store.canRedo).toBe(false)
  })

  it('dispatch clears redoStack', () => {
    const store = useMapStore()
    const cmd1 = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    const cmd2 = new PaintHexCommand({ q: 2, r: 2 }, '#00ff00')
    store.dispatch(cmd1)
    store.undo()
    expect(store.canRedo).toBe(true)
    store.dispatch(cmd2)
    expect(store.canRedo).toBe(false)
  })
})

describe('mapStore.undo/redo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('undo restores prior state', () => {
    const store = useMapStore()
    const stateBefore = store.mapData
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    store.dispatch(cmd)
    store.undo()
    expect(store.mapData).toEqual(stateBefore)
  })

  it('canRedo is true after undo', () => {
    const store = useMapStore()
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    store.dispatch(cmd)
    store.undo()
    expect(store.canRedo).toBe(true)
  })

  it('canUndo is false after undoing the only dispatch', () => {
    const store = useMapStore()
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    store.dispatch(cmd)
    store.undo()
    expect(store.canUndo).toBe(false)
  })

  it('undo on empty stack does not throw', () => {
    const store = useMapStore()
    expect(() => store.undo()).not.toThrow()
  })

  it('undo on empty stack leaves mapData unchanged', () => {
    const store = useMapStore()
    const before = store.mapData
    store.undo()
    expect(store.mapData).toBe(before)
  })

  it('redo restores state after undo', () => {
    const store = useMapStore()
    const cmd = new PaintHexCommand({ q: 1, r: 1 }, '#ff0000')
    store.dispatch(cmd)
    const afterDispatch = store.mapData
    store.undo()
    store.redo()
    expect(store.mapData).toEqual(afterDispatch)
  })

  it('redo on empty stack does not throw', () => {
    const store = useMapStore()
    expect(() => store.redo()).not.toThrow()
  })
})

describe('mapStore.beginStroke/endStroke', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('beginStroke + 3x dispatch + endStroke = undoStack.length 1', () => {
    const store = useMapStore()
    store.beginStroke()
    store.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    store.dispatch(new PaintHexCommand({ q: 2, r: 2 }, '#00ff00'))
    store.dispatch(new PaintHexCommand({ q: 3, r: 3 }, '#0000ff'))
    store.endStroke()
    expect(store.undoStackLength).toBe(1)
  })

  it('single undo after stroke reverts all 3 operations', () => {
    const store = useMapStore()
    const stateBefore = store.mapData
    store.beginStroke()
    store.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    store.dispatch(new PaintHexCommand({ q: 2, r: 2 }, '#00ff00'))
    store.dispatch(new PaintHexCommand({ q: 3, r: 3 }, '#0000ff'))
    store.endStroke()
    store.undo()
    expect(store.mapData).toEqual(stateBefore)
  })

  it('empty stroke (no dispatches) does not push to undoStack', () => {
    const store = useMapStore()
    store.beginStroke()
    store.endStroke()
    expect(store.undoStackLength).toBe(0)
  })

  // spec example: 10 hex paints collapsed
  it('10 dispatches in stroke = undoStack.length 1', () => {
    const store = useMapStore()
    store.beginStroke()
    for (let i = 0; i < 10; i++) {
      store.dispatch(new PaintHexCommand({ q: i, r: 0 }, '#ff0000'))
    }
    store.endStroke()
    expect(store.undoStackLength).toBe(1)
  })

  it('single undo after 10 dispatches reverts all 10', () => {
    const store = useMapStore()
    const stateBefore = store.mapData
    store.beginStroke()
    for (let i = 0; i < 10; i++) {
      store.dispatch(new PaintHexCommand({ q: i, r: 0 }, '#ff0000'))
    }
    store.endStroke()
    store.undo()
    expect(store.mapData).toEqual(stateBefore)
  })
})

describe('viewport/UI state excluded from undo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('undoStack only grows through dispatch()', () => {
    const store = useMapStore()
    expect(store.undoStackLength).toBe(0)
    store.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    expect(store.undoStackLength).toBe(1)
  })

  it('beginStroke/endStroke without dispatch does not change undoStack', () => {
    const store = useMapStore()
    store.beginStroke()
    store.endStroke()
    expect(store.undoStackLength).toBe(0)
  })
})

describe('mapStore.loadMapData', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets mapData to a deep clone of the provided data', () => {
    const store = useMapStore()
    const data: MapData = {
      name: 'Test Map',
      bounds: { radius: 3 },
      hexes: [{ q: 1, r: 1, color: '#ff0000' }],
      icons: [],
      lines: [],
      doodles: [],
    }
    store.loadMapData(data)
    expect(store.mapData).toEqual(data)
    expect(store.mapData).not.toBe(data)
  })

  it('clears undo stack after loadMapData', () => {
    const store = useMapStore()
    store.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    expect(store.canUndo).toBe(true)
    store.loadMapData(store.mapData)
    expect(store.canUndo).toBe(false)
  })

  it('clears redo stack after loadMapData', () => {
    const store = useMapStore()
    store.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    store.undo()
    expect(store.canRedo).toBe(true)
    store.loadMapData(store.mapData)
    expect(store.canRedo).toBe(false)
  })

  it('does not throw when called with a reactive proxy (no DATA_CLONE_ERR)', () => {
    const store = useMapStore()
    expect(() => store.loadMapData(store.mapData)).not.toThrow()
  })
})

describe('mapStore dispatch/undo/redo sync to sessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('dispatch syncs mapData to active session', () => {
    const mapStore = useMapStore()
    const sessionStore = useSessionStore()
    const session = sessionStore.makeSession()
    sessionStore.setActive(session.id)

    mapStore.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))

    expect(sessionStore.activeSession?.mapData).toEqual(mapStore.mapData)
  })

  it('dispatch stores a separate mapData object on the active session', () => {
    const mapStore = useMapStore()
    const sessionStore = useSessionStore()
    const session = sessionStore.makeSession()
    sessionStore.setActive(session.id)

    mapStore.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))

    expect(toRaw(sessionStore.activeSession?.mapData)).not.toBe(toRaw(mapStore.mapData))
  })

  it('dispatch marks session dirty', () => {
    const mapStore = useMapStore()
    const sessionStore = useSessionStore()
    const session = sessionStore.makeSession()
    sessionStore.setActive(session.id)

    expect(session.isDirty).toBe(false)
    mapStore.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    expect(session.isDirty).toBe(true)
  })

  it('dispatch does not throw when no active session', () => {
    const mapStore = useMapStore()
    expect(() => mapStore.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))).not.toThrow()
  })

  it('undo syncs mapData to active session', () => {
    const mapStore = useMapStore()
    const sessionStore = useSessionStore()
    const session = sessionStore.makeSession()
    sessionStore.setActive(session.id)

    mapStore.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    mapStore.undo()

    expect(sessionStore.activeSession?.mapData).toEqual(mapStore.mapData)
  })

  it('redo syncs mapData to active session', () => {
    const mapStore = useMapStore()
    const sessionStore = useSessionStore()
    const session = sessionStore.makeSession()
    sessionStore.setActive(session.id)

    mapStore.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    mapStore.undo()
    mapStore.redo()

    expect(sessionStore.activeSession?.mapData).toEqual(mapStore.mapData)
  })
})

describe('mapStore undo stack capacity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('dispatch 超過 100 次後 undoStack.length === 100 且最舊項目被移除', () => {
    const store = useMapStore()
    // dispatch 101 commands, each painting a unique hex
    for (let i = 0; i <= 100; i++) {
      store.dispatch(new PaintHexCommand({ q: i, r: 0 }, '#ff0000'))
    }
    expect(store.undoStackLength).toBe(100)
    // After 101 dispatches, undo 100 times should not restore the very first paint
    // (oldest entry was removed). The first hex painted is {q:0,r:0}.
    // After undoing 100 times, q:0,r:0 should still be painted (its inverse was dropped).
    for (let i = 0; i < 100; i++) {
      store.undo()
    }
    // q:0,r:0 was the first dispatch - its inverse is the oldest and was dropped
    const firstHex = store.mapData.hexes.find(h => h.q === 0 && h.r === 0)
    expect(firstHex).toBeDefined()
  })

  it('undoStack capacity applies to endStroke BatchCommand as well', () => {
    const store = useMapStore()
    // Fill up to capacity with direct dispatches
    for (let i = 0; i < 100; i++) {
      store.dispatch(new PaintHexCommand({ q: i, r: 0 }, '#ff0000'))
    }
    expect(store.undoStackLength).toBe(100)
    // One more stroke dispatch should trim oldest
    store.beginStroke()
    store.dispatch(new PaintHexCommand({ q: 200, r: 0 }, '#00ff00'))
    store.endStroke()
    expect(store.undoStackLength).toBe(100)
  })
})

describe('mapStore clears redo stack during stroke', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('undo 後開始新 stroke，第一次 dispatch，canRedo === false', () => {
    const store = useMapStore()
    store.dispatch(new PaintHexCommand({ q: 1, r: 1 }, '#ff0000'))
    store.undo()
    expect(store.canRedo).toBe(true)
    // Start a stroke and dispatch - redo should be cleared
    store.beginStroke()
    store.dispatch(new PaintHexCommand({ q: 2, r: 2 }, '#00ff00'))
    expect(store.canRedo).toBe(false)
    store.endStroke()
  })
})

describe('new tab starts with empty undo stack', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('canUndo is false on new store', () => {
    const store = useMapStore()
    expect(store.canUndo).toBe(false)
  })

  it('canRedo is false on new store', () => {
    const store = useMapStore()
    expect(store.canRedo).toBe(false)
  })

  it('undo on fresh store does not throw', () => {
    const store = useMapStore()
    expect(() => store.undo()).not.toThrow()
  })

  it('undo on fresh store leaves mapData unchanged', () => {
    const store = useMapStore()
    const before = store.mapData
    store.undo()
    expect(store.mapData).toBe(before)
  })
})
