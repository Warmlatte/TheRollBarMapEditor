import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { PlaceIconCommand, RemoveIconCommand } from '../../../commands/iconCommands'
import { useMapStore } from '../../../stores/mapStore'
import { useIconStore } from '../../../stores/iconStore'
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
  q: 1,
  r: 2,
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
    newId: vi.fn().mockReturnValue('new-icon-id'),
    mapData: BASE_MAP_DATA,
    ...overrides,
  }
}

function fakeEvent(): PointerEvent {
  return {} as PointerEvent
}

describe('iconHandler', () => {
  let mapStore: ReturnType<typeof useMapStore>
  let iconStore: ReturnType<typeof useIconStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    mapStore = useMapStore()
    iconStore = useIconStore()
    iconStore.setSelectedSvgId('svg-abc')
    iconStore.setSize(40)
    iconStore.setRotation(0)
    iconStore.setColor('#000000')
  })

  describe('onPointerDown — places icon', () => {
    it('dispatches PlaceIconCommand when selectedSvgId is set and hex is empty', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = makeCtx()
      iconHandler.onPointerDown(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(PlaceIconCommand)
    })

    it('placed icon has correct svgId, coordinates, size, rotation, color', async () => {
      const { iconHandler } = await import('../iconTool')
      iconStore.setSelectedSvgId('svg-abc')
      iconStore.setSize(60)
      iconStore.setRotation(45)
      iconStore.setColor('#ff0000')
      const ctx = makeCtx()
      iconHandler.onPointerDown(ctx, fakeEvent())
      const { state: next } = new PlaceIconCommand({
        id: 'new-icon-id',
        q: 1, r: 2,
        svgId: 'svg-abc',
        size: 60,
        rotation: 45,
        color: '#ff0000',
      }).apply(BASE_MAP_DATA)
      const icon = mapStore.mapData.icons[0]
      expect(icon?.svgId).toBe('svg-abc')
      expect(icon?.q).toBe(1)
      expect(icon?.r).toBe(2)
      expect(icon?.size).toBe(60)
      expect(icon?.rotation).toBe(45)
      expect(icon?.color).toBe('#ff0000')
      void next
    })
  })

  describe('onPointerDown — removes icon', () => {
    it('dispatches RemoveIconCommand when an icon exists at the pointer position', async () => {
      const { iconHandler } = await import('../iconTool')
      const dispatchSpy = vi.spyOn(mapStore, 'dispatch')
      const ctx = makeCtx({ findIconAt: vi.fn().mockReturnValue(EXISTING_ICON) })
      iconHandler.onPointerDown(ctx, fakeEvent())
      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(RemoveIconCommand)
    })

    it('removes the icon returned by findIconAt from mapStore state', async () => {
      const { iconHandler } = await import('../iconTool')
      mapStore.dispatch(new PlaceIconCommand(EXISTING_ICON))
      expect(mapStore.mapData.icons).toHaveLength(1)
      const ctx = makeCtx({ findIconAt: vi.fn().mockReturnValue(EXISTING_ICON) })
      iconHandler.onPointerDown(ctx, fakeEvent())
      expect(mapStore.mapData.icons.find((i) => i.id === EXISTING_ICON.id)).toBeUndefined()
    })
  })

  describe('onPointerDown — no-op cases', () => {
    it('does not dispatch when no selectedSvgId and hex is empty', async () => {
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
