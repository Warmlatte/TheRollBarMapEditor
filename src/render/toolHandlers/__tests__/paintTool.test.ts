import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { paintHandler } from '../paintTool'
import { useMapStore } from '../../../stores/mapStore'
import { useBrushStore } from '../../../stores/brushStore'
import { PaintHexCommand } from '../../../commands/hexCommands'
import type { ToolContext } from '../types'
import type { MapData } from '../../../data/types'

const BASE_MAP_DATA: MapData = {
  name: 'Test',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

function createMockContext(pixelToHexMock?: ReturnType<typeof vi.fn>): ToolContext {
  return {
    svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    pixelToHex: pixelToHexMock ?? vi.fn().mockReturnValue({ q: 0, r: 0 }),
    hexToPixel: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    findHexAt: vi.fn().mockReturnValue(undefined),
    findHexesInRadius: vi.fn().mockReturnValue([]),
    findIconAt: vi.fn().mockReturnValue(undefined),
    findLineAt: vi.fn().mockReturnValue(undefined),
    findDoodleAt: vi.fn().mockReturnValue(undefined),
    newId: vi.fn().mockReturnValue('id-1'),
    mapData: BASE_MAP_DATA,
  }
}

function fakeEvent(): PointerEvent {
  return {} as PointerEvent
}

describe('paintHandler', () => {
  let mapStore: ReturnType<typeof useMapStore>
  let brushStore: ReturnType<typeof useBrushStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    mapStore = useMapStore()
    brushStore = useBrushStore()
  })

  afterEach(() => {
    // Reset handler module-level state between tests
    paintHandler.onPointerUp(createMockContext(), fakeEvent())
  })

  // 1.1: pointer down on in-bounds hex
  describe('onPointerDown — in-bounds hex', () => {
    it('calls beginStroke exactly once', () => {
      const beginSpy = vi.spyOn(mapStore, 'beginStroke')
      paintHandler.onPointerDown(createMockContext(), fakeEvent())
      expect(beginSpy).toHaveBeenCalledTimes(1)
    })

    it('dispatches a PaintHexCommand for the in-bounds hex', () => {
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      paintHandler.onPointerDown(createMockContext(), fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PaintHexCommand)
    })

    it('canUndo is false during stroke because inverse is pending', () => {
      paintHandler.onPointerDown(createMockContext(), fakeEvent())
      expect(mapStore.canUndo).toBe(false)
    })
  })

  // 1.2: pointer down outside bounds
  describe('onPointerDown — outside map bounds', () => {
    it('calls beginStroke but does not dispatch', () => {
      const beginSpy = vi.spyOn(mapStore, 'beginStroke')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      // hexDistance({q:10,r:0},{q:0,r:0}) = 10 > 5 → out of bounds
      const ctx = createMockContext(vi.fn().mockReturnValue({ q: 10, r: 0 }))
      paintHandler.onPointerDown(ctx, fakeEvent())
      expect(beginSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy).not.toHaveBeenCalled()
    })
  })

  // 1.3: pointer move deduplication
  describe('onPointerMove — deduplication', () => {
    it('dispatches once per unique hex: A-J (10 distinct hexes → 10 dispatches)', () => {
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      // All 10 hexes are in-bounds (radius=5) and distinct
      const hexSeq = [
        { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }, { q: 4, r: 0 },
        { q: 5, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }, { q: 1, r: -1 }, { q: -1, r: 0 },
      ]
      const pixelToHex = vi.fn()
      hexSeq.forEach(h => pixelToHex.mockReturnValueOnce(h))
      const ctx = createMockContext(pixelToHex)

      paintHandler.onPointerDown(ctx, fakeEvent())        // A
      for (let i = 1; i < hexSeq.length; i++) {
        paintHandler.onPointerMove(ctx, fakeEvent())      // B–J
      }
      paintHandler.onPointerUp(ctx, fakeEvent())

      expect(dispatchSpy).toHaveBeenCalledTimes(10)
    })

    it('dispatches 3 times for A,B,C,B,A (revisiting A and B is skipped)', () => {
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const pixelToHex = vi.fn()
        .mockReturnValueOnce({ q: 0, r: 0 }) // pointerDown → A
        .mockReturnValueOnce({ q: 1, r: 0 }) // move → B
        .mockReturnValueOnce({ q: 2, r: 0 }) // move → C
        .mockReturnValueOnce({ q: 1, r: 0 }) // revisit B → skip
        .mockReturnValueOnce({ q: 0, r: 0 }) // revisit A → skip
      const ctx = createMockContext(pixelToHex)

      paintHandler.onPointerDown(ctx, fakeEvent()) // A
      paintHandler.onPointerMove(ctx, fakeEvent())  // B
      paintHandler.onPointerMove(ctx, fakeEvent())  // C
      paintHandler.onPointerMove(ctx, fakeEvent())  // B revisit
      paintHandler.onPointerMove(ctx, fakeEvent())  // A revisit
      paintHandler.onPointerUp(ctx, fakeEvent())

      expect(dispatchSpy).toHaveBeenCalledTimes(3)
    })

    it('dispatches 1 time for A,A,A,A (same hex repeated)', () => {
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = createMockContext(vi.fn().mockReturnValue({ q: 0, r: 0 }))

      paintHandler.onPointerDown(ctx, fakeEvent()) // A → dispatch
      paintHandler.onPointerMove(ctx, fakeEvent())  // A → skip
      paintHandler.onPointerMove(ctx, fakeEvent())  // A → skip
      paintHandler.onPointerMove(ctx, fakeEvent())  // A → skip
      paintHandler.onPointerUp(ctx, fakeEvent())

      expect(dispatchSpy).toHaveBeenCalledTimes(1)
    })
  })

  // 1.4: pointer up and stroke reset
  describe('onPointerUp', () => {
    it('calls endStroke exactly once', () => {
      const endSpy = vi.spyOn(mapStore, 'endStroke')
      const ctx = createMockContext()
      paintHandler.onPointerDown(ctx, fakeEvent())
      paintHandler.onPointerUp(ctx, fakeEvent())
      expect(endSpy).toHaveBeenCalledTimes(1)
    })

    it('resets deduplication set so second stroke can re-paint hex A', () => {
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = createMockContext(vi.fn().mockReturnValue({ q: 0, r: 0 }))

      // First stroke: paint A, end stroke
      paintHandler.onPointerDown(ctx, fakeEvent())
      paintHandler.onPointerUp(ctx, fakeEvent())

      // Second stroke: paint A again (set was reset between strokes)
      paintHandler.onPointerDown(ctx, fakeEvent())
      paintHandler.onPointerUp(ctx, fakeEvent())

      expect(dispatchSpy).toHaveBeenCalledTimes(2)
    })
  })

  // 1.5: brush color at dispatch time
  describe('brush color', () => {
    it('uses brushStore.color at dispatch time as newColor', () => {
      brushStore.color = '#ff0000'
      const ctx = createMockContext(vi.fn().mockReturnValue({ q: 0, r: 0 }))

      paintHandler.onPointerDown(ctx, fakeEvent())

      expect(mapStore.mapData.hexes[0]?.color).toBe('#ff0000')
    })
  })
})
