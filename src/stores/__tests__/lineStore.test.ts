import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLineStore } from '../lineStore'
import { useSessionStore } from '../sessionStore'

const LINE_KEY = 'hexmap.line.v1'

describe('lineStore watches activeId', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('clears pendingAnchor when activeId changes', async () => {
    const session = useSessionStore()
    const line = useLineStore()
    const s1 = session.makeSession()
    const s2 = session.makeSession()
    session.setActive(s1.id)

    // Set a pending anchor
    line.pendingAnchor = { x: 10, y: 20 }
    expect(line.pendingAnchor).not.toBeNull()

    // Switch active session
    session.setActive(s2.id)

    // Vue watch runs on next tick
    await Promise.resolve()

    expect(line.pendingAnchor).toBeNull()
  })
})

describe('lineStore setWidth clamping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('setWidth(0) clamps to 1', () => {
    const line = useLineStore()
    line.setWidth(0)
    expect(line.lineWidth).toBe(1)
  })

  it('setWidth(15) clamps to 10', () => {
    const line = useLineStore()
    line.setWidth(15)
    expect(line.lineWidth).toBe(10)
  })

  it('setWidth(5) stays at 5', () => {
    const line = useLineStore()
    line.setWidth(5)
    expect(line.lineWidth).toBe(5)
  })

  it('setWidth(1) stays at 1 (lower boundary)', () => {
    const line = useLineStore()
    line.setWidth(1)
    expect(line.lineWidth).toBe(1)
  })

  it('setWidth(10) stays at 10 (upper boundary)', () => {
    const line = useLineStore()
    line.setWidth(10)
    expect(line.lineWidth).toBe(10)
  })
})

describe('lineStore preference persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('restores width and dashed from localStorage on init', () => {
    localStorage.setItem(LINE_KEY, JSON.stringify({ width: 3, dashed: true }))
    const line = useLineStore()
    expect(line.lineWidth).toBe(3)
    expect(line.dashed).toBe(true)
  })

  it('uses default values when key is absent', () => {
    const line = useLineStore()
    expect(line.lineWidth).toBe(2)
    expect(line.dashed).toBe(false)
  })

  it('uses default values when key contains invalid JSON', () => {
    localStorage.setItem(LINE_KEY, '{invalid')
    const line = useLineStore()
    expect(line.lineWidth).toBe(2)
    expect(line.dashed).toBe(false)
  })

  it('uses default values when preference fields have invalid types', () => {
    localStorage.setItem(LINE_KEY, JSON.stringify({
      width: 'wide',
      dashed: 'yes',
      dashLength: null,
      dashGap: {},
    }))
    const line = useLineStore()
    expect(line.lineWidth).toBe(2)
    expect(line.dashed).toBe(false)
    expect(line.dashLength).toBe(8)
    expect(line.dashGap).toBe(4)
  })

  it('clamps persisted preference number fields to safe ranges', () => {
    localStorage.setItem(LINE_KEY, JSON.stringify({
      width: 99,
      dashed: true,
      dashLength: 0,
      dashGap: 999,
    }))
    const line = useLineStore()
    expect(line.lineWidth).toBe(10)
    expect(line.dashed).toBe(true)
    expect(line.dashLength).toBe(1)
    expect(line.dashGap).toBe(40)
  })

  it('uses default values when preference number fields are not finite', () => {
    localStorage.setItem(LINE_KEY, JSON.stringify({
      width: 3,
      dashed: true,
      dashLength: null,
      dashGap: 4,
    }))
    const line = useLineStore()
    expect(line.lineWidth).toBe(3)
    expect(line.dashed).toBe(true)
    expect(line.dashLength).toBe(8)
    expect(line.dashGap).toBe(4)
  })

  it('writes to localStorage when setWidth is called', () => {
    const line = useLineStore()
    line.setWidth(5)
    const stored = JSON.parse(localStorage.getItem(LINE_KEY)!)
    expect(stored.width).toBe(5)
  })

  it('writes to localStorage when setDashed is called', () => {
    const line = useLineStore()
    line.setDashed(true)
    const stored = JSON.parse(localStorage.getItem(LINE_KEY)!)
    expect(stored.dashed).toBe(true)
  })

  it('persists dashLength when setDashLength is called', () => {
    const line = useLineStore()
    line.setDashLength(15)
    const stored = JSON.parse(localStorage.getItem(LINE_KEY)!)
    expect(stored.dashLength).toBe(15)
    expect(line.dashLength).toBe(15)
  })

  it('persists dashGap when setDashGap is called', () => {
    const line = useLineStore()
    line.setDashGap(7)
    const stored = JSON.parse(localStorage.getItem(LINE_KEY)!)
    expect(stored.dashGap).toBe(7)
    expect(line.dashGap).toBe(7)
  })

  it('clamps dashLength below 1 to 1', () => {
    const line = useLineStore()
    line.setDashLength(0)
    expect(line.dashLength).toBe(1)
  })

  it('clamps dashGap above 40 to 40', () => {
    const line = useLineStore()
    line.setDashGap(50)
    expect(line.dashGap).toBe(40)
  })

  it('restores dashLength and dashGap from localStorage on init', () => {
    localStorage.setItem(LINE_KEY, JSON.stringify({ width: 2, dashed: false, dashLength: 15, dashGap: 7 }))
    const line = useLineStore()
    expect(line.dashLength).toBe(15)
    expect(line.dashGap).toBe(7)
  })

  it('rethrows localStorage read failures when loading preferences', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === LINE_KEY) throw new Error('storage unavailable')
      return null
    })
    expect(() => useLineStore()).toThrow('storage unavailable')
  })
})

const SAVED_LINES_KEY = 'hexmap.savedLines.v1'

describe('lineStore saved line preset validation — invalid data is discarded', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('invalid JSON in savedLines key falls back to 4 default seeds', () => {
    localStorage.setItem(SAVED_LINES_KEY, '{not valid json}')
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(4)
  })

  it('non-array JSON in savedLines key falls back to 4 default seeds', () => {
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify({ id: 'x', color: '#000', width: 2, dashed: false }))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(4)
  })

  it('preset missing id is discarded', () => {
    const valid = { id: 'keep', color: '#111', width: 2, dashed: false, dashLength: 8, dashGap: 4 }
    const missing_id = { color: '#222', width: 3, dashed: true, dashLength: 8, dashGap: 4 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([valid, missing_id]))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(1)
    expect(line.savedLines[0]!.id).toBe('keep')
  })

  it('preset missing color is discarded', () => {
    const valid = { id: 'keep', color: '#111', width: 2, dashed: false, dashLength: 8, dashGap: 4 }
    const missing_color = { id: 'bad', width: 3, dashed: true, dashLength: 8, dashGap: 4 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([valid, missing_color]))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(1)
    expect(line.savedLines[0]!.id).toBe('keep')
  })

  it('preset missing width is discarded', () => {
    const valid = { id: 'keep', color: '#111', width: 2, dashed: false, dashLength: 8, dashGap: 4 }
    const missing_width = { id: 'bad', color: '#222', dashed: true, dashLength: 8, dashGap: 4 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([valid, missing_width]))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(1)
  })

  it('preset missing dashed is discarded', () => {
    const valid = { id: 'keep', color: '#111', width: 2, dashed: false, dashLength: 8, dashGap: 4 }
    const missing_dashed = { id: 'bad', color: '#222', width: 3, dashLength: 8, dashGap: 4 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([valid, missing_dashed]))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(1)
  })
})

describe('lineStore saved line preset validation — legacy and boundary values', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('legacy preset without dashLength/dashGap fills defaults 8 and 4', () => {
    const legacy = { id: 'old', color: '#333', width: 2, dashed: false }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([legacy]))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(1)
    expect(line.savedLines[0]!.dashLength).toBe(8)
    expect(line.savedLines[0]!.dashGap).toBe(4)
  })

  it('preset with dashLength as non-number is discarded', () => {
    const bad = { id: 'bad', color: '#333', width: 2, dashed: false, dashLength: 'fast', dashGap: 4 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([bad]))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(0)
  })

  it('preset with dashGap as non-number is discarded', () => {
    const bad = { id: 'bad', color: '#333', width: 2, dashed: false, dashLength: 8, dashGap: null }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([bad]))
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(0)
  })

  it('width=99 is clamped to 10', () => {
    const entry = { id: 'clamp', color: '#000', width: 99, dashed: false, dashLength: 8, dashGap: 4 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([entry]))
    const line = useLineStore()
    expect(line.savedLines[0]!.width).toBe(10)
  })

  it('dashLength=0 is clamped to 1', () => {
    const entry = { id: 'clamp', color: '#000', width: 2, dashed: false, dashLength: 0, dashGap: 4 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([entry]))
    const line = useLineStore()
    expect(line.savedLines[0]!.dashLength).toBe(1)
  })

  it('dashGap=99 is clamped to 40', () => {
    const entry = { id: 'clamp', color: '#000', width: 2, dashed: false, dashLength: 8, dashGap: 99 }
    localStorage.setItem(SAVED_LINES_KEY, JSON.stringify([entry]))
    const line = useLineStore()
    expect(line.savedLines[0]!.dashGap).toBe(40)
  })

  it('rethrows localStorage read failures when loading saved lines', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === SAVED_LINES_KEY) throw new Error('saved lines unavailable')
      return null
    })
    expect(() => useLineStore()).toThrow('saved lines unavailable')
  })
})

describe('lineStore saved line presets', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('saveCurrentLine creates a preset with given color', () => {
    const line = useLineStore()
    line.setWidth(3)
    line.setDashed(true)
    line.setDashLength(10)
    line.setDashGap(5)
    const id = line.saveCurrentLine('#aabbcc')
    expect(id).toBeTruthy()
    expect(line.savedLines).toHaveLength(5) // 4 seeds + 1 new
    const saved = line.savedLines.find(s => s.id === id)
    expect(saved?.color).toBe('#aabbcc')
    expect(saved?.width).toBe(3)
    expect(saved?.dashed).toBe(true)
    expect(saved?.dashLength).toBe(10)
    expect(saved?.dashGap).toBe(5)
  })

  it('saveCurrentLine with identical settings reuses existing id (no duplicate)', () => {
    const line = useLineStore()
    line.setWidth(3)
    line.setDashed(true)
    line.setDashLength(10)
    line.setDashGap(5)
    const id1 = line.saveCurrentLine('#aabbcc')
    const id2 = line.saveCurrentLine('#aabbcc')
    expect(id1).toBe(id2)
    expect(line.savedLines.filter(s => s.color === '#aabbcc' && s.width === 3).length).toBe(1)
  })

  it('applySavedLine updates store values and returns the entry', () => {
    const line = useLineStore()
    const id = line.saveCurrentLine('#aabbcc')
    line.setWidth(5)
    const entry = line.applySavedLine(id)
    expect(entry).not.toBeNull()
    expect(line.lineWidth).toBe(entry!.width)
    expect(line.dashed).toBe(entry!.dashed)
    expect(line.dashLength).toBe(entry!.dashLength)
    expect(line.dashGap).toBe(entry!.dashGap)
  })

  it('applySavedLine returns null for unknown id', () => {
    const line = useLineStore()
    expect(line.applySavedLine('nonexistent')).toBeNull()
  })

  it('removeSavedLine removes the entry', () => {
    const line = useLineStore()
    const id = line.saveCurrentLine('#aabbcc')
    const countBefore = line.savedLines.length
    line.removeSavedLine(id)
    expect(line.savedLines.length).toBe(countBefore - 1)
    expect(line.savedLines.find(s => s.id === id)).toBeUndefined()
  })

  it('seeds 4 default lines when savedLines key is absent', () => {
    const line = useLineStore()
    expect(line.savedLines).toHaveLength(4)
  })

  it('persists savedLines to localStorage', () => {
    const line = useLineStore()
    line.saveCurrentLine('#112233')
    const stored = JSON.parse(localStorage.getItem(SAVED_LINES_KEY)!)
    expect(Array.isArray(stored)).toBe(true)
    expect(stored.length).toBe(5) // 4 seeds + 1
  })

  it('does not update savedLines when save persistence fails', () => {
    const line = useLineStore()
    const before = line.savedLines
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
      if (key === SAVED_LINES_KEY) throw new Error('persist failed')
    })
    expect(() => line.saveCurrentLine('#112233')).toThrow('persist failed')
    expect(line.savedLines).toBe(before)
  })

  it('does not update savedLines when remove persistence fails', () => {
    const line = useLineStore()
    const id = line.saveCurrentLine('#112233')
    const before = line.savedLines
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
      if (key === SAVED_LINES_KEY) throw new Error('persist failed')
    })
    expect(() => line.removeSavedLine(id)).toThrow('persist failed')
    expect(line.savedLines).toBe(before)
  })
})
