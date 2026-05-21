import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

describe('lineStore preference persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
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
})

const SAVED_LINES_KEY = 'hexmap.savedLines.v1'

describe('lineStore saved line presets', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
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
})
