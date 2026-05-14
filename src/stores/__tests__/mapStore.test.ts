import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMapStore } from '../mapStore'
import { PaintHexCommand } from '../../commands/hexCommands'
import type { Command } from '../../commands/types'
import type { MapData } from '../../data/types'

function makeCmd(apply: (state: MapData) => MapData): Command {
  const cmd: Command = {
    apply(state: MapData) {
      return { state: apply(state), inverse: cmd }
    },
  }
  return cmd
}

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
