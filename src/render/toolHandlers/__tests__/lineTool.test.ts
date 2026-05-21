import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { lineHandler, _resetLineToolForTest } from '../lineTool'
import { useLineStore } from '../../../stores/lineStore'
import { useMapStore } from '../../../stores/mapStore'
import { DrawLineCommand, RemoveLineCommand } from '../../../commands/lineCommands'
import type { ToolContext } from '../types'
import type { MapData, Line } from '../../../data/types'

const testLine: Line = {
  id: 'line-a',
  x1: 0, y1: 0,
  x2: 100, y2: 100,
  width: 2,
  dashed: false,
  dashLength: 8,
  dashGap: 4,
  color: '#000000',
}

const BASE_MAP_DATA: MapData = {
  name: 'Test',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

function createMockContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    pixelToHex: vi.fn().mockReturnValue({ q: 0, r: 0 }),
    hexToPixel: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    findHexAt: vi.fn().mockReturnValue(undefined),
    findHexesInRadius: vi.fn().mockReturnValue([]),
    findIconAt: vi.fn().mockReturnValue(undefined),
    findLineAt: vi.fn().mockReturnValue(undefined),
    findDoodleAt: vi.fn().mockReturnValue(undefined),
    newId: vi.fn().mockReturnValue('new-line-id'),
    mapData: BASE_MAP_DATA,
    ...overrides,
  }
}

function fakeEvent(overrides?: Partial<PointerEvent>): PointerEvent {
  return { button: 0, shiftKey: false, ...overrides } as PointerEvent
}

describe('lineTool — chain-click drawing', () => {
  let mapStore: ReturnType<typeof useMapStore>
  let lineStore: ReturnType<typeof useLineStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mapStore = useMapStore()
    lineStore = useLineStore()
    _resetLineToolForTest()
  })

  afterEach(() => {
    _resetLineToolForTest()
    localStorage.clear()
  })

  it('first click sets pendingAnchor and does not dispatch', () => {
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx = createMockContext({
      svgPoint: vi.fn().mockReturnValue({ x: 50, y: 80 }),
    })
    lineHandler.onPointerDown(ctx, fakeEvent())
    expect(lineStore.pendingAnchor).not.toBeNull()
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('second click at different position dispatches DrawLineCommand', () => {
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx1 = createMockContext({
      svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    })
    const ctx2 = createMockContext({
      svgPoint: vi.fn().mockReturnValue({ x: 100, y: 100 }),
    })
    lineHandler.onPointerDown(ctx1, fakeEvent())
    lineHandler.onPointerDown(ctx2, fakeEvent())
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy.mock.calls[0]![0]).toBeInstanceOf(DrawLineCommand)
  })

  it('second click at different position updates pendingAnchor (chain continues)', () => {
    const ctx1 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }) })
    const ctx2 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 100, y: 100 }) })
    lineHandler.onPointerDown(ctx1, fakeEvent())
    lineHandler.onPointerDown(ctx2, fakeEvent())
    expect(lineStore.pendingAnchor).not.toBeNull()
  })

  it('click at same position (distance < 1px) clears pendingAnchor without dispatch', () => {
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 100, y: 200 }) })
    lineHandler.onPointerDown(ctx, fakeEvent())
    // second click within 1px
    const ctx2 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 100.5, y: 200.3 }) })
    lineHandler.onPointerDown(ctx2, fakeEvent())
    expect(lineStore.pendingAnchor).toBeNull()
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('click at distance ~1.41px dispatches (borderline >= 1px case)', () => {
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx1 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 100, y: 200 }) })
    lineHandler.onPointerDown(ctx1, fakeEvent())
    const ctx2 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 101, y: 201 }) })
    lineHandler.onPointerDown(ctx2, fakeEvent())
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy.mock.calls[0]![0]).toBeInstanceOf(DrawLineCommand)
  })

  it('dispatched DrawLineCommand carries current dashLength and dashGap', () => {
    lineStore.setDashLength(12)
    lineStore.setDashGap(6)
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx1 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }) })
    const ctx2 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 100, y: 100 }) })
    lineHandler.onPointerDown(ctx1, fakeEvent())
    lineHandler.onPointerDown(ctx2, fakeEvent())
    const cmd = dispatchSpy.mock.calls[0]![0] as DrawLineCommand
    // Apply it to check the stored line fields
    const { state } = cmd.apply(BASE_MAP_DATA)
    expect(state.lines[0]!.dashLength).toBe(12)
    expect(state.lines[0]!.dashGap).toBe(6)
  })
})

describe('lineTool — preview line', () => {
  let lineStore: ReturnType<typeof useLineStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    lineStore = useLineStore()
    _resetLineToolForTest()
  })

  afterEach(() => {
    _resetLineToolForTest()
    localStorage.clear()
  })

  it('onPointerMove with pending anchor updates previewEnd', () => {
    const ctx1 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }) })
    lineHandler.onPointerDown(ctx1, fakeEvent())
    const ctx2 = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 50, y: 60 }) })
    lineHandler.onPointerMove(ctx2, fakeEvent())
    expect(lineStore.previewEnd).not.toBeNull()
  })

  it('onPointerMove without pending anchor keeps previewEnd null', () => {
    const ctx = createMockContext({ svgPoint: vi.fn().mockReturnValue({ x: 50, y: 60 }) })
    lineHandler.onPointerMove(ctx, fakeEvent())
    expect(lineStore.previewEnd).toBeNull()
  })
})

describe('lineTool — Shift+drag erase', () => {
  let mapStore: ReturnType<typeof useMapStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mapStore = useMapStore()
    _resetLineToolForTest()
  })

  afterEach(() => {
    _resetLineToolForTest()
    localStorage.clear()
  })

  it('Shift+left-click calls beginStroke', () => {
    const beginSpy = vi.spyOn(mapStore, 'beginStroke')
    const ctx = createMockContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    expect(beginSpy).toHaveBeenCalledTimes(1)
  })

  it('Shift+left-click on a line dispatches RemoveLineCommand', () => {
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx = createMockContext({ findLineAt: vi.fn().mockReturnValue(testLine) })
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy.mock.calls[0]![0]).toBeInstanceOf(RemoveLineCommand)
  })

  it('Shift+left-click on empty area calls beginStroke but no dispatch', () => {
    const beginSpy = vi.spyOn(mapStore, 'beginStroke')
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx = createMockContext({ findLineAt: vi.fn().mockReturnValue(undefined) })
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    expect(beginSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('drag erase over same line does not dispatch RemoveLineCommand twice', () => {
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const ctx = createMockContext({ findLineAt: vi.fn().mockReturnValue(testLine) })
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    lineHandler.onPointerMove(ctx, fakeEvent())
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
  })

  it('drag erase over different line dispatches RemoveLineCommand for each', () => {
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const line2: Line = { ...testLine, id: 'line-b' }
    const findLineAt = vi.fn()
      .mockReturnValueOnce(testLine)
      .mockReturnValueOnce(line2)
    const ctx = createMockContext({ findLineAt })
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    lineHandler.onPointerMove(ctx, fakeEvent())
    expect(dispatchSpy).toHaveBeenCalledTimes(2)
  })

  it('pointerUp ends erase stroke', () => {
    const endSpy = vi.spyOn(mapStore, 'endStroke')
    const ctx = createMockContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    lineHandler.onPointerUp(ctx, fakeEvent())
    expect(endSpy).toHaveBeenCalledTimes(1)
  })

  it('isDragging returns true during Shift+drag', () => {
    const ctx = createMockContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    expect(lineHandler.isDragging()).toBe(true)
  })

  it('isDragging returns false after pointerUp', () => {
    const ctx = createMockContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    lineHandler.onPointerUp(ctx, fakeEvent())
    expect(lineHandler.isDragging()).toBe(false)
  })
})
