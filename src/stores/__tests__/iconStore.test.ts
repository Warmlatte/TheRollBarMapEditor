import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIconStore } from '../iconStore'

describe('iconStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selectedSvgId defaults to null', () => {
    const store = useIconStore()
    expect(store.selectedSvgId).toBeNull()
  })

  it('setSelectedSvgId updates selectedSvgId', () => {
    const store = useIconStore()
    store.setSelectedSvgId('abc-123')
    expect(store.selectedSvgId).toBe('abc-123')
  })

  it('setSelectedSvgId accepts null to clear selection', () => {
    const store = useIconStore()
    store.setSelectedSvgId('abc-123')
    store.setSelectedSvgId(null)
    expect(store.selectedSvgId).toBeNull()
  })

  it('size defaults to 65', () => {
    const store = useIconStore()
    expect(store.size).toBe(65)
  })

  it('setSize updates size', () => {
    const store = useIconStore()
    store.setSize(60)
    expect(store.size).toBe(60)
  })

  it('setSize clamps size to the source app slider bounds', () => {
    const store = useIconStore()
    store.setSize(5)
    expect(store.size).toBe(10)
    store.setSize(350)
    expect(store.size).toBe(300)
  })

  it('rotation defaults to 0', () => {
    const store = useIconStore()
    expect(store.rotation).toBe(0)
  })

  it('setRotation updates rotation', () => {
    const store = useIconStore()
    store.setRotation(90)
    expect(store.rotation).toBe(90)
  })

  it('setRotation normalizes rotation to 0-359 degrees', () => {
    const store = useIconStore()
    store.setRotation(450)
    expect(store.rotation).toBe(90)
    store.setRotation(-45)
    expect(store.rotation).toBe(315)
  })

  it('color defaults to the source app green', () => {
    const store = useIconStore()
    expect(store.color).toBe('#5b992e')
  })

  it('setColor updates color', () => {
    const store = useIconStore()
    store.setColor('#ff0000')
    expect(store.color).toBe('#ff0000')
  })

  it('savedIcons defaults to built-in colored icon presets', () => {
    const store = useIconStore()
    expect(store.savedIcons).toEqual([
      { id: 'mountain-default', svgId: 'mountain', color: '#7a7a7a', size: 65, rotation: 0 },
      { id: 'tree-default', svgId: 'tree', color: '#4a7a3a', size: 65, rotation: 0 },
      { id: 'tower-default', svgId: 'tower', color: '#7a4a2a', size: 65, rotation: 0 },
      { id: 'skull-default', svgId: 'skull', color: '#c33232', size: 65, rotation: 0 },
    ])
  })

  it('saveCurrentIcon stores the selected icon with the current visual state', () => {
    const store = useIconStore()
    store.setSelectedSvgId('mountain')
    store.setColor('#336699')
    store.setSize(125)
    store.setRotation(45)

    store.saveCurrentIcon()

    expect(store.savedIcons).toContainEqual({
      id: 'mountain-336699-125-45',
      svgId: 'mountain',
      color: '#336699',
      size: 125,
      rotation: 45,
    })
  })

  it('saveCurrentIcon ignores duplicate selected icon visual states', () => {
    const store = useIconStore()
    store.setSelectedSvgId('mountain')
    store.setColor('#7a7a7a')
    store.setSize(65)
    store.setRotation(0)
    const initialSavedIcons = store.savedIcons

    store.saveCurrentIcon()
    store.saveCurrentIcon()

    expect(store.savedIcons).toBe(initialSavedIcons)
    expect(
      store.savedIcons.filter((icon) =>
        icon.svgId === 'mountain' &&
        icon.color === '#7a7a7a' &&
        icon.size === 65 &&
        icon.rotation === 0),
    ).toHaveLength(1)
  })

  it('saveCurrentIcon appends with immutable array replacement', () => {
    const store = useIconStore()
    store.setSelectedSvgId('mountain')
    store.setColor('#336699')
    const initialSavedIcons = store.savedIcons

    store.saveCurrentIcon()

    expect(store.savedIcons).not.toBe(initialSavedIcons)
    expect(store.savedIcons).toContainEqual({
      id: 'mountain-336699-65-0',
      svgId: 'mountain',
      color: '#336699',
      size: 65,
      rotation: 0,
    })
  })

  it('saveCurrentIcon does nothing when no icon is selected', () => {
    const store = useIconStore()

    store.saveCurrentIcon()

    expect(store.savedIcons).toEqual([
      { id: 'mountain-default', svgId: 'mountain', color: '#7a7a7a', size: 65, rotation: 0 },
      { id: 'tree-default', svgId: 'tree', color: '#4a7a3a', size: 65, rotation: 0 },
      { id: 'tower-default', svgId: 'tower', color: '#7a4a2a', size: 65, rotation: 0 },
      { id: 'skull-default', svgId: 'skull', color: '#c33232', size: 65, rotation: 0 },
    ])
  })

  it('removeSavedIcon removes a preset by id with immutable array replacement', () => {
    const store = useIconStore()
    const initialSavedIcons = store.savedIcons

    store.removeSavedIcon('tree-default')

    expect(store.savedIcons).not.toBe(initialSavedIcons)
    expect(store.savedIcons.some((icon) => icon.id === 'tree-default')).toBe(false)
  })

  it('does not expose selectedSvg (old API)', () => {
    const store = useIconStore()
    expect((store as unknown as Record<string, unknown>)['selectedSvg']).toBeUndefined()
  })

  it('does not expose iconSize (old API)', () => {
    const store = useIconStore()
    expect((store as unknown as Record<string, unknown>)['iconSize']).toBeUndefined()
  })

  it('does not expose iconRotation (old API)', () => {
    const store = useIconStore()
    expect((store as unknown as Record<string, unknown>)['iconRotation']).toBeUndefined()
  })
})
