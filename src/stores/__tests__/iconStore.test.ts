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

  it('rotation defaults to 0', () => {
    const store = useIconStore()
    expect(store.rotation).toBe(0)
  })

  it('setRotation updates rotation', () => {
    const store = useIconStore()
    store.setRotation(90)
    expect(store.rotation).toBe(90)
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
      { svgId: 'mountain', color: '#7a7a7a' },
      { svgId: 'tree', color: '#4a7a3a' },
      { svgId: 'tower', color: '#7a4a2a' },
      { svgId: 'skull', color: '#c33232' },
    ])
  })

  it('saveCurrentIcon stores the selected icon with the current color', () => {
    const store = useIconStore()
    store.setSelectedSvgId('mountain')
    store.setColor('#336699')

    store.saveCurrentIcon()

    expect(store.savedIcons).toContainEqual({ svgId: 'mountain', color: '#336699' })
  })

  it('saveCurrentIcon ignores duplicate selected icon and color pairs', () => {
    const store = useIconStore()
    store.setSelectedSvgId('mountain')
    store.setColor('#7a7a7a')
    const initialSavedIcons = store.savedIcons

    store.saveCurrentIcon()
    store.saveCurrentIcon()

    expect(store.savedIcons).toBe(initialSavedIcons)
    expect(store.savedIcons.filter((icon) => icon.svgId === 'mountain' && icon.color === '#7a7a7a')).toHaveLength(1)
  })

  it('saveCurrentIcon appends with immutable array replacement', () => {
    const store = useIconStore()
    store.setSelectedSvgId('mountain')
    store.setColor('#336699')
    const initialSavedIcons = store.savedIcons

    store.saveCurrentIcon()

    expect(store.savedIcons).not.toBe(initialSavedIcons)
    expect(store.savedIcons).toContainEqual({ svgId: 'mountain', color: '#336699' })
  })

  it('saveCurrentIcon does nothing when no icon is selected', () => {
    const store = useIconStore()

    store.saveCurrentIcon()

    expect(store.savedIcons).toEqual([
      { svgId: 'mountain', color: '#7a7a7a' },
      { svgId: 'tree', color: '#4a7a3a' },
      { svgId: 'tower', color: '#7a4a2a' },
      { svgId: 'skull', color: '#c33232' },
    ])
  })

  it('does not expose selectedSvg (old API)', () => {
    const store = useIconStore()
    expect((store as Record<string, unknown>)['selectedSvg']).toBeUndefined()
  })

  it('does not expose iconSize (old API)', () => {
    const store = useIconStore()
    expect((store as Record<string, unknown>)['iconSize']).toBeUndefined()
  })

  it('does not expose iconRotation (old API)', () => {
    const store = useIconStore()
    expect((store as Record<string, unknown>)['iconRotation']).toBeUndefined()
  })
})
