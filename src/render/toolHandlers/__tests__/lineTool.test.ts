import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { lineHandler, _resetLineToolForTest } from '../lineTool'
import { useLineStore } from '../../../stores/lineStore'
import { useMapStore } from '../../../stores/mapStore'
import { useBrushStore } from '../../../stores/brushStore'
import { useSnapStore } from '../../../stores/snapStore'
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
    findIconsInRadius: vi.fn().mockReturnValue([]),
    findLinesInRadius: vi.fn().mockReturnValue([]),
    findDoodlesInRadius: vi.fn().mockReturnValue([]),
    tryCapture: vi.fn(),
    tryRelease: vi.fn(),
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
    useSnapStore().setMode('free')
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
    useSnapStore().setMode('free')
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

describe('lineTool — eyedrop (Shift+right-click)', () => {
  let lineStore: ReturnType<typeof useLineStore>
  let brushStore: ReturnType<typeof useBrushStore>

  const hitLine: Line = {
    id: 'x',
    x1: 0, y1: 0, x2: 1, y2: 1,
    width: 3,
    dashed: true,
    dashLength: 6,
    dashGap: 3,
    color: '#ff0000',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    lineStore = useLineStore()
    brushStore = useBrushStore()
    _resetLineToolForTest()
  })

  afterEach(() => {
    _resetLineToolForTest()
    localStorage.clear()
  })

  function createEyedropContext(overrides?: Partial<ToolContext>): ToolContext {
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
      svgPointFromMouse: vi.fn().mockReturnValue({ x: 10, y: 20 }),
      ...overrides,
    }
  }

  it('eyedrop on existing line applies all line properties', () => {
    const ctx = createEyedropContext({ findLineAt: vi.fn().mockReturnValue(hitLine) })
    const mockEvent = { clientX: 0, clientY: 0 } as MouseEvent
    lineHandler.onEyedrop!(ctx, mockEvent)
    expect(lineStore.lineWidth).toBe(3)
    expect(lineStore.dashed).toBe(true)
    expect(lineStore.dashLength).toBe(6)
    expect(lineStore.dashGap).toBe(3)
    expect(brushStore.currentColor).toBe('#ff0000')
  })

  it('eyedrop uses svgPointFromMouse to resolve coordinates', () => {
    const svgPointFromMouse = vi.fn().mockReturnValue({ x: 10, y: 20 })
    const findLineAt = vi.fn().mockReturnValue(undefined)
    const ctx = createEyedropContext({ svgPointFromMouse, findLineAt })
    lineHandler.onEyedrop!(ctx, { clientX: 0, clientY: 0 } as MouseEvent)
    expect(svgPointFromMouse).toHaveBeenCalledTimes(1)
    expect(findLineAt).toHaveBeenCalledWith(10, 20)
  })

  it('eyedrop on empty area is a no-op (no store changes)', () => {
    const initialWidth = lineStore.lineWidth
    const initialColor = brushStore.currentColor
    const ctx = createEyedropContext({ findLineAt: vi.fn().mockReturnValue(undefined) })
    lineHandler.onEyedrop!(ctx, { clientX: 0, clientY: 0 } as MouseEvent)
    expect(lineStore.lineWidth).toBe(initialWidth)
    expect(brushStore.currentColor).toBe(initialColor)
  })
})

describe('lineTool — pointer capture during Shift+drag', () => {
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

  function createCaptureContext(overrides?: Partial<ToolContext>): ToolContext {
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

  it('Shift+pointerDown calls tryCapture with the pointerId', () => {
    const ctx = createCaptureContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true, pointerId: 77 }))
    expect(ctx.tryCapture).toHaveBeenCalledTimes(1)
    expect(ctx.tryCapture).toHaveBeenCalledWith(77)
  })

  it('pointerUp after Shift+drag calls tryRelease', () => {
    const ctx = createCaptureContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true, pointerId: 77 }))
    lineHandler.onPointerUp(ctx, fakeEvent({ pointerId: 77 }))
    expect(ctx.tryRelease).toHaveBeenCalledTimes(1)
    expect(ctx.tryRelease).toHaveBeenCalledWith(77)
  })

  it('non-Shift pointerDown does NOT call tryCapture', () => {
    const ctx = createCaptureContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: false }))
    expect(ctx.tryCapture).not.toHaveBeenCalled()
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

  it('onPointerCancel ends erase stroke and calls endStroke once', () => {
    const endSpy = vi.spyOn(mapStore, 'endStroke')
    const ctx = createMockContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    lineHandler.onPointerCancel(ctx, fakeEvent({ pointerId: 5 }))
    expect(endSpy).toHaveBeenCalledTimes(1)
  })

  it('onPointerCancel releases capture using the event pointerId (not 0)', () => {
    const tryRelease = vi.fn()
    const ctx = { ...createMockContext(), tryRelease }
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true, pointerId: 5 }))
    lineHandler.onPointerCancel(ctx, fakeEvent({ pointerId: 5 }))
    expect(tryRelease).toHaveBeenCalledWith(5)
  })

  it('onPointerCancel clears isDragging', () => {
    const ctx = createMockContext()
    lineHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    expect(lineHandler.isDragging()).toBe(true)
    lineHandler.onPointerCancel(ctx, fakeEvent({ pointerId: 5 }))
    expect(lineHandler.isDragging()).toBe(false)
  })
})
