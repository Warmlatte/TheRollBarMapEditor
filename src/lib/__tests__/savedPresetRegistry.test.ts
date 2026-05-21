import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSavedPresetRegistry, type Saved } from '../savedPresetRegistry'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

type Color = { color: string }

function makeColorRegistry(storageKey = 'test.colors.v1', seed?: Color[]) {
  let list: Saved<Color>[] = []
  return {
    registry: createSavedPresetRegistry<Color>({
      storageKey,
      binding: {
        get: () => list,
        set: (next) => { list = next },
      },
      validate: (raw) => {
        if (raw && typeof raw === 'object' && typeof (raw as { color?: unknown }).color === 'string') {
          return { color: (raw as { color: string }).color }
        }
        return null
      },
      isDuplicate: (a, b) => a.color === b.color,
      seed,
    }),
    getList: () => list,
  }
}

describe('createSavedPresetRegistry factory creates a load/save/remove/find API', () => {
  it('returns an object with load, save, remove, and find functions', () => {
    const { registry } = makeColorRegistry()
    expect(typeof registry.load).toBe('function')
    expect(typeof registry.save).toBe('function')
    expect(typeof registry.remove).toBe('function')
    expect(typeof registry.find).toBe('function')
  })
})

describe('load restores saved items from localStorage or seeds on first run', () => {
  it('first run seeds default items when localStorage key is absent', () => {
    const seeds: Color[] = [{ color: '#4a7a3a' }, { color: '#d4b56e' }]
    const { registry, getList } = makeColorRegistry('test.seed.v1', seeds)
    registry.load()
    expect(getList()).toHaveLength(2)
    expect(getList()[0]).toHaveProperty('id')
    expect(getList()[0]?.color).toBe('#4a7a3a')
    expect(getList()[1]?.color).toBe('#d4b56e')
    const stored = localStorage.getItem('test.seed.v1')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!)).toHaveLength(2)
  })

  it('user-cleared list is not re-seeded when key is "[]"', () => {
    localStorage.setItem('test.seed.v1', '[]')
    const seeds: Color[] = [{ color: '#4a7a3a' }]
    const { registry, getList } = makeColorRegistry('test.seed.v1', seeds)
    registry.load()
    expect(getList()).toHaveLength(0)
  })

  it('hydrates from localStorage when key exists', () => {
    localStorage.setItem(
      'test.colors.v1',
      JSON.stringify([{ id: 'X1', color: '#abc' }]),
    )
    const { registry, getList } = makeColorRegistry()
    registry.load()
    expect(getList()).toHaveLength(1)
    expect(getList()[0]?.color).toBe('#abc')
    expect(getList()[0]?.id).toBe('X1')
  })

  it('corrupted items are skipped during load — partial corruption example from spec', () => {
    // Example from spec: {id:"a",color:"#fff"},{id:"b",color:null} → only first valid
    localStorage.setItem(
      'test.colors.v1',
      JSON.stringify([
        { id: 'a', color: '#fff' },
        { id: 'b', color: null },
      ]),
    )
    const { registry, getList } = makeColorRegistry()
    registry.load()
    expect(getList()).toHaveLength(1)
    expect(getList()[0]?.id).toBe('a')
    expect(getList()[0]?.color).toBe('#fff')
  })

  it('skips entries missing id', () => {
    localStorage.setItem(
      'test.colors.v1',
      JSON.stringify([
        { id: 'good', color: '#aaa' },
        { color: '#bbb' },
        null,
      ]),
    )
    const { registry, getList } = makeColorRegistry()
    registry.load()
    expect(getList()).toHaveLength(1)
    expect(getList()[0]?.id).toBe('good')
  })

  it('bad JSON does not throw, leaves list empty', () => {
    localStorage.setItem('test.colors.v1', 'not valid json')
    const { registry, getList } = makeColorRegistry()
    expect(() => registry.load()).not.toThrow()
    expect(getList()).toEqual([])
  })

  it('non-array root leaves list empty', () => {
    localStorage.setItem('test.colors.v1', JSON.stringify({ wrapper: 'not array' }))
    const { registry, getList } = makeColorRegistry()
    registry.load()
    expect(getList()).toEqual([])
  })
})

describe('save deduplicates and persists new items', () => {
  it('saving a new item appends it and returns a generated id', () => {
    const { registry, getList } = makeColorRegistry()
    const id = registry.save({ color: '#ff0000' })
    expect(getList()).toHaveLength(1)
    expect(getList()[0]?.id).toBe(id)
    expect(getList()[0]?.color).toBe('#ff0000')
  })

  it('saving two distinct items grows the list to 2', () => {
    const { registry, getList } = makeColorRegistry()
    registry.save({ color: '#aaa' })
    registry.save({ color: '#bbb' })
    expect(getList()).toHaveLength(2)
  })

  it('saving a duplicate returns existing id and does not grow the list', () => {
    const { registry, getList } = makeColorRegistry()
    const id1 = registry.save({ color: '#aaa' })
    const id2 = registry.save({ color: '#aaa' })
    expect(id1).toBe(id2)
    expect(getList()).toHaveLength(1)
  })

  it('save writes to localStorage', () => {
    const { registry } = makeColorRegistry('test.persist.v1')
    registry.save({ color: '#abc' })
    const raw = localStorage.getItem('test.persist.v1')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)[0].color).toBe('#abc')
  })

  it('throws and does not mutate the list when localStorage write fails', () => {
    const { registry, getList } = makeColorRegistry('test.persist-fail.v1')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })

    expect(() => registry.save({ color: '#abc' })).toThrow('storage full')
    expect(getList()).toHaveLength(0)
  })
})

describe('remove deletes an item by id and persists the change', () => {
  it('removing an existing id removes only that item', () => {
    const { registry, getList } = makeColorRegistry()
    const id = registry.save({ color: '#aaa' })
    registry.save({ color: '#bbb' })
    registry.remove(id)
    expect(getList()).toHaveLength(1)
    expect(getList()[0]?.color).toBe('#bbb')
  })

  it('removing an existing id updates localStorage', () => {
    const { registry } = makeColorRegistry('test.remove.v1')
    const id = registry.save({ color: '#aaa' })
    registry.save({ color: '#bbb' })
    registry.remove(id)
    const raw = JSON.parse(localStorage.getItem('test.remove.v1') ?? '[]')
    expect(raw).toHaveLength(1)
    expect(raw[0].color).toBe('#bbb')
  })

  it('removing a non-existent id is a silent no-op', () => {
    const { registry, getList } = makeColorRegistry()
    registry.save({ color: '#aaa' })
    expect(() => registry.remove('does-not-exist')).not.toThrow()
    expect(getList()).toHaveLength(1)
  })

  it('throws and keeps the list unchanged when localStorage write fails during remove', () => {
    const { registry, getList } = makeColorRegistry('test.remove-fail.v1')
    const id = registry.save({ color: '#aaa' })
    registry.save({ color: '#bbb' })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage full')
    })

    expect(() => registry.remove(id)).toThrow('storage full')
    expect(getList()).toHaveLength(2)
  })
})

describe('find returns the item with the given id or undefined', () => {
  it('find returns the matching Saved<T>', () => {
    const { registry } = makeColorRegistry()
    const id = registry.save({ color: '#aaa' })
    const found = registry.find(id)
    expect(found?.id).toBe(id)
    expect(found?.color).toBe('#aaa')
  })

  it('find returns undefined for unknown id', () => {
    const { registry } = makeColorRegistry()
    registry.save({ color: '#aaa' })
    expect(registry.find('unknown')).toBeUndefined()
  })
})

describe('multi-field isDuplicate', () => {
  it('uses custom isDuplicate for complex types', () => {
    type Multi = { color: string; width: number }
    let list: Saved<Multi>[] = []
    const reg = createSavedPresetRegistry<Multi>({
      storageKey: 'test.multi.v1',
      binding: { get: () => list, set: (n) => { list = n } },
      validate: (raw) => {
        const r = raw as { color?: unknown; width?: unknown }
        if (typeof r?.color === 'string' && typeof r?.width === 'number') {
          return { color: r.color, width: r.width }
        }
        return null
      },
      isDuplicate: (a, b) => a.color === b.color && a.width === b.width,
    })
    const id1 = reg.save({ color: '#abc', width: 3 })
    const id2 = reg.save({ color: '#abc', width: 3 })
    const id3 = reg.save({ color: '#abc', width: 5 })
    expect(id1).toBe(id2)
    expect(id1).not.toBe(id3)
    expect(list).toHaveLength(2)
  })
})
