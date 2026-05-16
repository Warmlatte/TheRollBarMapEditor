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
})
