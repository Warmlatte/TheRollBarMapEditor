import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrushStore } from '../brushStore'

const STORAGE_KEY = 'hexmap.savedCells.v1'
const SEED_COLORS = ['#4a7a3a', '#d4b56e', '#4a7d9d', '#7a7a7a']

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('brushStore exposes SavedCell type and a complete saved-cells API', () => {
  it('savedCells starts empty before loadSavedCells is called', () => {
    const store = useBrushStore()
    expect(store.savedCells).toEqual([])
  })

  it('each SavedCell entry has id: string and color: string', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'abc', color: '#ff0000' }]),
    )
    store.loadSavedCells()
    expect(store.savedCells[0]).toMatchObject({ id: 'abc', color: '#ff0000' })
    expect(typeof store.savedCells[0]?.id).toBe('string')
    expect(typeof store.savedCells[0]?.color).toBe('string')
  })

  it('exposes loadSavedCells, saveCurrentCell, applySavedCell, removeSavedCell as functions', () => {
    const store = useBrushStore()
    expect(typeof store.loadSavedCells).toBe('function')
    expect(typeof store.saveCurrentCell).toBe('function')
    expect(typeof store.applySavedCell).toBe('function')
    expect(typeof store.removeSavedCell).toBe('function')
  })
})

describe('loadSavedCells initializes the list from localStorage', () => {
  it('restores items from localStorage when key exists', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'id1', color: '#aabbcc' }]),
    )
    store.loadSavedCells()
    expect(store.savedCells).toHaveLength(1)
    expect(store.savedCells[0]?.color).toBe('#aabbcc')
  })

  it('skips corrupted entries during load', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'good', color: '#fff' },
        { id: 'bad', color: 123 },
      ]),
    )
    store.loadSavedCells()
    expect(store.savedCells).toHaveLength(1)
    expect(store.savedCells[0]?.id).toBe('good')
  })
})

describe('saved cells are seeded with four default TRPG terrain colors on first run', () => {
  it('seeds 4 default colors when localStorage key is absent', () => {
    const store = useBrushStore()
    store.loadSavedCells()
    expect(store.savedCells).toHaveLength(4)
    const colors = store.savedCells.map((c) => c.color)
    expect(colors).toContain('#4a7a3a')
    expect(colors).toContain('#d4b56e')
    expect(colors).toContain('#4a7d9d')
    expect(colors).toContain('#7a7a7a')
  })

  it('does not re-seed when localStorage contains "[]"', () => {
    localStorage.setItem(STORAGE_KEY, '[]')
    const store = useBrushStore()
    store.loadSavedCells()
    expect(store.savedCells).toHaveLength(0)
  })

  it('does not re-seed when localStorage contains items', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'x', color: '#111111' }]),
    )
    const store = useBrushStore()
    store.loadSavedCells()
    expect(store.savedCells).toHaveLength(1)
  })
})

describe('applySavedCell updates the active brush color', () => {
  it('applySavedCell with a valid id updates brushStore.color', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'cell-1', color: '#123456' }]),
    )
    store.loadSavedCells()
    store.applySavedCell('cell-1')
    expect(store.color).toBe('#123456')
  })

  it('applySavedCell with unknown id is a silent no-op', () => {
    const store = useBrushStore()
    store.loadSavedCells()
    const originalColor = store.color
    expect(() => store.applySavedCell('nonexistent')).not.toThrow()
    expect(store.color).toBe(originalColor)
  })
})

describe('removeSavedCell removes the entry with the given id', () => {
  it('removeSavedCell removes the matching entry', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'a', color: '#aaa' },
        { id: 'b', color: '#bbb' },
      ]),
    )
    store.loadSavedCells()
    store.removeSavedCell('a')
    expect(store.savedCells).toHaveLength(1)
    expect(store.savedCells[0]?.id).toBe('b')
  })

  it('removeSavedCell with unknown id is a no-op', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'a', color: '#aaa' }]),
    )
    store.loadSavedCells()
    expect(() => store.removeSavedCell('unknown')).not.toThrow()
    expect(store.savedCells).toHaveLength(1)
  })
})

describe('saved cells persist across page reloads via localStorage', () => {
  it('saveCurrentCell writes to localStorage', () => {
    const store = useBrushStore()
    store.loadSavedCells()
    // After seed, clear to start fresh
    store.savedCells.forEach((c) => store.removeSavedCell(c.id))
    store.setColor('#ff0000')
    store.saveCurrentCell()
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.some((c: { color: string }) => c.color === '#ff0000')).toBe(true)
  })

  it('removeSavedCell updates localStorage', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'del-me', color: '#abc' }]),
    )
    store.loadSavedCells()
    store.removeSavedCell('del-me')
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(raw.some((c: { id: string }) => c.id === 'del-me')).toBe(false)
  })

  it('saved cells survive a simulated reload (re-call loadSavedCells)', () => {
    const store = useBrushStore()
    store.setColor('#abcdef')
    store.loadSavedCells()
    // clear seeded, save a custom one
    store.savedCells.forEach((c) => store.removeSavedCell(c.id))
    store.saveCurrentCell()

    // Simulate reload: reset pinia + call loadSavedCells again
    setActivePinia(createPinia())
    const store2 = useBrushStore()
    store2.loadSavedCells()
    expect(store2.savedCells.some((c) => c.color === '#abcdef')).toBe(true)
  })

  it('removed cells do not reappear after reload', () => {
    const store = useBrushStore()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'gone', color: '#dead00' }]),
    )
    store.loadSavedCells()
    store.removeSavedCell('gone')

    setActivePinia(createPinia())
    const store2 = useBrushStore()
    store2.loadSavedCells()
    expect(store2.savedCells.some((c) => c.id === 'gone')).toBe(false)
  })
})

describe('saveCurrentCell deduplicates', () => {
  it('does not add duplicate color', () => {
    const store = useBrushStore()
    store.loadSavedCells()
    store.savedCells.forEach((c) => store.removeSavedCell(c.id))
    store.setColor('#ff0000')
    store.saveCurrentCell()
    store.saveCurrentCell()
    expect(store.savedCells.filter((c) => c.color === '#ff0000')).toHaveLength(1)
  })
})
