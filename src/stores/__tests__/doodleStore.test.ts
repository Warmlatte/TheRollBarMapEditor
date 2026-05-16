import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDoodleStore } from '../doodleStore'
import { useSessionStore } from '../sessionStore'

const DOODLE_KEY = 'hexmap.doodle.v1'

describe('doodleStore watches activeId', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('clears pendingStroke when activeId changes', async () => {
    const session = useSessionStore()
    const doodle = useDoodleStore()
    const s1 = session.makeSession()
    const s2 = session.makeSession()
    session.setActive(s1.id)

    // Set pending stroke points
    doodle.pendingStroke = [{ x: 1, y: 2 }, { x: 3, y: 4 }]
    expect(doodle.pendingStroke.length).toBeGreaterThan(0)

    // Switch active session
    session.setActive(s2.id)

    // Vue watch runs on next tick
    await Promise.resolve()

    expect(doodle.pendingStroke.length).toBe(0)
  })
})

describe('doodleStore preference persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('restores width and opacity from localStorage on init', () => {
    localStorage.setItem(DOODLE_KEY, JSON.stringify({ width: 6, opacity: 0.5 }))
    const doodle = useDoodleStore()
    expect(doodle.doodleWidth).toBe(6)
    expect(doodle.doodleOpacity).toBe(0.5)
  })

  it('uses default values when key is absent', () => {
    const doodle = useDoodleStore()
    expect(doodle.doodleWidth).toBe(3)
    expect(doodle.doodleOpacity).toBe(1)
  })

  it('uses default values when key contains invalid JSON', () => {
    localStorage.setItem(DOODLE_KEY, '{invalid')
    const doodle = useDoodleStore()
    expect(doodle.doodleWidth).toBe(3)
    expect(doodle.doodleOpacity).toBe(1)
  })

  it('writes to localStorage when setWidth is called', () => {
    const doodle = useDoodleStore()
    doodle.setWidth(8)
    const stored = JSON.parse(localStorage.getItem(DOODLE_KEY)!)
    expect(stored.width).toBe(8)
  })

  it('writes to localStorage when setOpacity is called', () => {
    const doodle = useDoodleStore()
    doodle.setOpacity(0.7)
    const stored = JSON.parse(localStorage.getItem(DOODLE_KEY)!)
    expect(stored.opacity).toBe(0.7)
  })
})
