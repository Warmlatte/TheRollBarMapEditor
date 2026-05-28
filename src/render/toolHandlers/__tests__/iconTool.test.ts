import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { PlaceIconCommand, RemoveIconCommand } from '../../../commands/iconCommands'
import { useMapStore } from '../../../stores/mapStore'
import { useIconStore } from '../../../stores/iconStore'
import { useBrushStore } from '../../../stores/brushStore'
import { useSnapStore } from '../../../stores/snapStore'
import type { ToolContext } from '../types'
import type { Icon, MapData } from '../../../data/types'

const BASE_MAP_DATA: MapData = {
  name: 'Test',
  bounds: { radius: 5 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

const EXISTING_ICON: Icon = {
  id: 'icon-existing',
  x: 10,
  y: 20,
  svgId: 'svg-old',
  size: 40,
  rotation: 0,
  color: '#000000',
}

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    svgPoint: vi.fn().mockReturnValue({ x: 10, y: 20 }),
    pixelToHex: vi.fn().mockReturnValue({ q: 1, r: 2 }),
    hexToPixel: vi.fn().mockReturnValue({ x: 10, y: 20 }),
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
    newId: vi.fn().mockReturnValue('new-icon-id'),
    mapData: BASE_MAP_DATA,
    ...overrides,
  }
}

function fakeEvent(overrides?: Partial<PointerEvent>): PointerEvent {
  return { button: 0, shiftKey: false, pointerId: 1, ...overrides } as PointerEvent
}

describe('iconHandler', () => {
  let mapStore: ReturnType<typeof useMapStore>
  let iconStore: ReturnType<typeof useIconStore>
  let snapStore: ReturnType<typeof useSnapStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    mapStore = useMapStore()
    iconStore = useIconStore()
    snapStore = useSnapStore()
    iconStore.setSelectedSvgId('svg-abc')
    iconStore.setSize(40)
    iconStore.setRotation(0)
    iconStore.setColor('#000000')
    snapStore.setMode('free')
  })

  describe('onPointerDown — places icon (free mode)', () => {
    it('dispatches PlaceIconCommand when selectedSvgId is set and position is in bounds', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = makeCtx()
      iconHandler.onPointerDown(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PlaceIconCommand)
    })

    it('places icon at cursor pixel coordinates in free mode', async () => {
      const { iconHandler } = await import('../iconTool')
      snapStore.setMode('free')
      iconStore.setSelectedSvgId('svg-abc')
      iconStore.setSize(60)
      iconStore.setRotation(45)
      iconStore.setColor('#ff0000')
      const ctx = makeCtx({ svgPoint: vi.fn().mockReturnValue({ x: 10, y: 20 }) })
      iconHandler.onPointerDown(ctx, fakeEvent())
      const icon = mapStore.mapData.icons[0]
      expect(icon?.svgId).toBe('svg-abc')
      expect(icon?.x).toBe(10)
      expect(icon?.y).toBe(20)
      expect(icon?.size).toBe(60)
      expect(icon?.rotation).toBe(45)
      expect(icon?.color).toBe('#ff0000')
    })

    it('dispatches PlaceIconCommand even when an icon already exists at cursor position', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = makeCtx({ findIconAt: vi.fn().mockReturnValue(EXISTING_ICON) })
      iconHandler.onPointerDown(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PlaceIconCommand)
    })
  })

  describe('onPointerDown — node snap places icon at snapped position', () => {
    it('snaps to hex center when cursor is at center in node mode', async () => {
      const { iconHandler } = await import('../iconTool')
      snapStore.setMode('node')
      // cursor at (0,0) snaps to hex center (0,0) of hex(q=0,r=0)
      const ctx = makeCtx({
        svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
        pixelToHex: vi.fn().mockReturnValue({ q: 0, r: 0 }),
      })
      iconHandler.onPointerDown(ctx, fakeEvent())
      const icon = mapStore.mapData.icons[0]
      expect(icon?.x).toBeCloseTo(0, 5)
      expect(icon?.y).toBeCloseTo(0, 5)
    })
  })

  describe('onPointerDown — boundary guard', () => {
    it('does not dispatch when snap position is outside map boundary', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = makeCtx({
        svgPoint: vi.fn().mockReturnValue({ x: 0, y: 0 }),
        pixelToHex: vi.fn().mockReturnValue({ q: 10, r: 10 }),
      })
      iconHandler.onPointerDown(ctx, fakeEvent())
      expect(dispatchSpy).not.toHaveBeenCalled()
    })

    it('dispatches when snap position is on the boundary (hexDistance === radius)', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      // hexDistance({q:3,r:2}) = (3+5+2)/2 = 5 === radius 5
      const ctx = makeCtx({
        pixelToHex: vi.fn().mockReturnValue({ q: 3, r: 2 }),
      })
      iconHandler.onPointerDown(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PlaceIconCommand)
    })
  })

  describe('onPointerDown — no-op cases', () => {
    it('does not dispatch when no selectedSvgId and position is empty', async () => {
      const { iconHandler } = await import('../iconTool')
      iconStore.setSelectedSvgId(null)
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      iconHandler.onPointerDown(makeCtx(), fakeEvent())
      expect(dispatchSpy).not.toHaveBeenCalled()
    })

    it('does not throw when called with no selectedSvgId', async () => {
      const { iconHandler } = await import('../iconTool')
      iconStore.setSelectedSvgId(null)
      expect(() => iconHandler.onPointerDown(makeCtx(), fakeEvent())).not.toThrow()
    })
  })

  describe('onPointerMove and onPointerUp', () => {
    it('onPointerMove does not dispatch', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      iconHandler.onPointerMove(makeCtx(), fakeEvent())
      expect(dispatchSpy).not.toHaveBeenCalled()
    })

    it('onPointerUp does not dispatch', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      iconHandler.onPointerUp(makeCtx(), fakeEvent())
      expect(dispatchSpy).not.toHaveBeenCalled()
    })
  })
})

describe('iconHandler — Shift+drag erase', () => {
  let mapStore: ReturnType<typeof useMapStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    mapStore = useMapStore()
    const { _resetIconToolForTest } = await import('../iconTool')
    _resetIconToolForTest()
  })

  afterEach(async () => {
    const { _resetIconToolForTest } = await import('../iconTool')
    _resetIconToolForTest()
    localStorage.clear()
  })

  it('Shift+drag over two icons wraps into a single BatchCommand', async () => {
    const { iconHandler } = await import('../iconTool')
    const iconA: Icon = { id: 'a', x: 0, y: 0, svgId: 'svg', size: 40, rotation: 0, color: '#000' }
    const iconB: Icon = { id: 'b', x: 10, y: 10, svgId: 'svg', size: 40, rotation: 0, color: '#000' }
    const findIconAt = vi.fn()
      .mockReturnValueOnce(iconA)
      .mockReturnValueOnce(iconB)
    const ctx = makeCtx({ findIconAt })
    const initialStack = mapStore.undoStackLength
    iconHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    iconHandler.onPointerMove(ctx, fakeEvent())
    iconHandler.onPointerUp(ctx, fakeEvent())
    expect(mapStore.undoStackLength).toBe(initialStack + 1)
  })

  it('Shift+drag over same icon only dispatches RemoveIconCommand once', async () => {
    const { iconHandler } = await import('../iconTool')
    const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
    const icon: Icon = { id: 'dup', x: 0, y: 0, svgId: 'svg', size: 40, rotation: 0, color: '#000' }
    const ctx = makeCtx({ findIconAt: vi.fn().mockReturnValue(icon) })
    iconHandler.onPointerDown(ctx, fakeEvent({ shiftKey: true }))
    iconHandler.onPointerMove(ctx, fakeEvent())
    iconHandler.onPointerUp(ctx, fakeEvent())
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy.mock.calls[0]![0]).toBeInstanceOf(RemoveIconCommand)
  })
})

describe('iconHandler — eyedrop (Shift+right-click)', () => {
  let iconStore: ReturnType<typeof useIconStore>
  let brushStore: ReturnType<typeof useBrushStore>

  const HIT_ICON: Icon = {
    id: 'hit-icon',
    x: 10, y: 20,
    svgId: 'svg-xyz',
    size: 55,
    rotation: 90,
    color: '#aabbcc',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    iconStore = useIconStore()
    brushStore = useBrushStore()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('eyedrop on existing icon updates 4 store properties', async () => {
    const { iconHandler } = await import('../iconTool')
    const ctx: ToolContext = {
      ...makeCtx({ findIconAt: vi.fn().mockReturnValue(HIT_ICON) }),
      svgPointFromMouse: vi.fn().mockReturnValue({ x: 10, y: 20 }),
    }
    iconHandler.onEyedrop!(ctx, { clientX: 0, clientY: 0 } as MouseEvent)
    expect(iconStore.selectedSvgId).toBe('svg-xyz')
    expect(iconStore.size).toBe(55)
    expect(iconStore.rotation).toBe(90)
    expect(brushStore.currentColor).toBe('#aabbcc')
  })

  it('eyedrop on empty area is a no-op', async () => {
    const { iconHandler } = await import('../iconTool')
    iconStore.setSelectedSvgId('initial-svg')
    const initialColor = brushStore.currentColor
    const ctx: ToolContext = {
      ...makeCtx({ findIconAt: vi.fn().mockReturnValue(undefined) }),
      svgPointFromMouse: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    }
    iconHandler.onEyedrop!(ctx, { clientX: 0, clientY: 0 } as MouseEvent)
    expect(iconStore.selectedSvgId).toBe('initial-svg')
    expect(brushStore.currentColor).toBe(initialColor)
  })
})
