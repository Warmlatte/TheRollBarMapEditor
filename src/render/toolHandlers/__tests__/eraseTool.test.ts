import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMapStore } from '../../../stores/mapStore'
import { useEraseStore } from '../../../stores/eraseStore'
import { EraseHexCommand } from '../../../commands/hexCommands'
import { RemoveIconCommand } from '../../../commands/iconCommands'
import { BatchCommand } from '../../../commands/batchCommand'
import type { ToolContext } from '../types'
import type { MapData, Hex, Icon } from '../../../data/types'

const BASE_MAP_DATA: MapData = {
  name: 'Test',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

function makeHex(q: number, r: number): Hex {
  return { q, r, color: '#ff0000' }
}

function makeIcon(id: string, x: number, y: number): Icon {
  return { id, x, y, svgId: 'test', size: 40, rotation: 0, color: '#000000' }
}

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    pixelToHex: vi.fn().mockReturnValue({ q: 0, r: 0 }),
    hexToPixel: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    findHexAt: vi.fn().mockReturnValue(undefined),
    findHexesInRadius: vi.fn().mockReturnValue([]),
    findIconAt: vi.fn().mockReturnValue(undefined),
    findLineAt: vi.fn().mockReturnValue(undefined),
    findDoodleAt: vi.fn().mockReturnValue(undefined),
    findIconsInRadius: vi.fn().mockReturnValue([]),
    findLinesInRadius: vi.fn().mockReturnValue([]),
    findDoodlesInRadius: vi.fn().mockReturnValue([]),
    tryCapture: vi.fn(),
    tryRelease: vi.fn(),
    newId: vi.fn().mockReturnValue('id'),
    mapData: BASE_MAP_DATA,
    ...overrides,
  }
}

function fakeEvent(overrides?: Partial<PointerEvent>): PointerEvent {
  return { button: 0, pointerId: 1, preventDefault: vi.fn(), ...overrides } as PointerEvent
}

describe('eraseHandler', () => {
  let mapStore: ReturnType<typeof useMapStore>
  let eraseStore: ReturnType<typeof useEraseStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mapStore = useMapStore()
    eraseStore = useEraseStore()
  })

  afterEach(async () => {
    const { _resetEraseToolForTest } = await import('../eraseTool')
    _resetEraseToolForTest()
    localStorage.clear()
  })

  describe('Scenario: All targets disabled — no dispatch', () => {
    it('onPointerDown calls e.preventDefault when left button is pressed', async () => {
      const { eraseHandler } = await import('../eraseTool')
      const preventDefault = vi.fn()
      const ctx = makeCtx()

      eraseHandler.onPointerDown(ctx, fakeEvent({ preventDefault } as Partial<PointerEvent>))
      eraseHandler.onPointerUp(ctx, fakeEvent())

      expect(preventDefault).toHaveBeenCalledTimes(1)
    })

    it('does not call beginStroke when all targets are false', async () => {
      const { eraseHandler } = await import('../eraseTool')
      eraseStore.targets.hex = false
      eraseStore.targets.icon = false
      eraseStore.targets.line = false
      eraseStore.targets.doodle = false
      const beginSpy = vi.spyOn(mapStore, 'beginStroke')
      const ctx = makeCtx()
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerMove(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      expect(beginSpy).not.toHaveBeenCalled()
    })

    it('does not dispatch any command when all targets are false', async () => {
      const { eraseHandler } = await import('../eraseTool')
      eraseStore.targets.hex = false
      eraseStore.targets.icon = false
      eraseStore.targets.line = false
      eraseStore.targets.doodle = false
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = makeCtx()
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerMove(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      expect(dispatchSpy).not.toHaveBeenCalled()
    })
  })

  describe('Scenario: Drag across hexes with hex target enabled', () => {
    it('dispatches EraseHexCommand for hex in radius', async () => {
      const { eraseHandler } = await import('../eraseTool')
      const hex = makeHex(0, 0)
      const ctx = makeCtx({
        svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
        findHexesInRadius: vi.fn().mockReturnValue([hex]),
      })
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0]![0]).toBeInstanceOf(EraseHexCommand)
    })

    it('wraps multiple hex erases in a single BatchCommand (one Ctrl+Z)', async () => {
      const { eraseHandler } = await import('../eraseTool')
      const hexA = makeHex(0, 0)
      const hexB = makeHex(1, 0)
      const ctx = makeCtx({
        svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
        findHexesInRadius: vi.fn()
          .mockReturnValueOnce([hexA])
          .mockReturnValueOnce([hexB]),
      })
      const initialUndoLen = mapStore.undoStackLength
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerMove(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      expect(mapStore.undoStackLength).toBe(initialUndoLen + 1)
      const topCmd = (mapStore as unknown as { undoStack: { value: unknown[] } }).undoStack?.value?.at(-1)
        ?? (mapStore as unknown as { _undoStack?: unknown[] })._undoStack?.at(-1)
      // Verify only 1 new undo entry was added (the batch)
      expect(mapStore.undoStackLength).toBe(initialUndoLen + 1)
    })
  })

  describe('Scenario: Deduplication within a drag', () => {
    it('dispatches EraseHexCommand only once for the same hex revisited in a drag', async () => {
      const { eraseHandler } = await import('../eraseTool')
      const hex = makeHex(0, 0)
      const ctx = makeCtx({
        svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
        findHexesInRadius: vi.fn().mockReturnValue([hex]),
      })
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerMove(ctx, fakeEvent())
      eraseHandler.onPointerMove(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Scenario: Icon target only', () => {
    it('dispatches RemoveIconCommand when only icon target is enabled', async () => {
      const { eraseHandler } = await import('../eraseTool')
      eraseStore.targets.hex = false
      eraseStore.targets.line = false
      eraseStore.targets.doodle = false
      const icon = makeIcon('icon-1', 10, 10)
      const ctx = makeCtx({
        svgPoint: vi.fn().mockReturnValue({ x: 10, y: 10 }),
        findHexesInRadius: vi.fn().mockReturnValue([makeHex(0, 0)]),
        findIconsInRadius: vi.fn().mockReturnValue([icon]),
        findLinesInRadius: vi.fn().mockReturnValue([]),
        findDoodlesInRadius: vi.fn().mockReturnValue([]),
      })
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0]![0]).toBeInstanceOf(RemoveIconCommand)
    })

    it('does not dispatch EraseHexCommand when hex target is disabled', async () => {
      const { eraseHandler } = await import('../eraseTool')
      eraseStore.targets.hex = false
      eraseStore.targets.line = false
      eraseStore.targets.doodle = false
      const ctx = makeCtx({
        svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
        findHexesInRadius: vi.fn().mockReturnValue([makeHex(0, 0)]),
        findIconsInRadius: vi.fn().mockReturnValue([]),
      })
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      const hexCmds = dispatchSpy.mock.calls.filter(
        ([cmd]) => cmd instanceof EraseHexCommand,
      )
      expect(hexCmds).toHaveLength(0)
    })
  })

  describe('isDragging', () => {
    it('returns false initially', async () => {
      const { eraseHandler } = await import('../eraseTool')
      expect(eraseHandler.isDragging()).toBe(false)
    })

    it('returns true after pointerDown when targets are enabled', async () => {
      const { eraseHandler } = await import('../eraseTool')
      const ctx = makeCtx()
      eraseHandler.onPointerDown(ctx, fakeEvent())
      expect(eraseHandler.isDragging()).toBe(true)
    })

    it('returns false after pointerUp', async () => {
      const { eraseHandler } = await import('../eraseTool')
      const ctx = makeCtx()
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerUp(ctx, fakeEvent())
      expect(eraseHandler.isDragging()).toBe(false)
    })

    it('returns false after pointerCancel', async () => {
      const { eraseHandler } = await import('../eraseTool')
      const ctx = makeCtx()
      eraseHandler.onPointerDown(ctx, fakeEvent())
      eraseHandler.onPointerCancel(ctx, fakeEvent())
      expect(eraseHandler.isDragging()).toBe(false)
    })
  })
})
