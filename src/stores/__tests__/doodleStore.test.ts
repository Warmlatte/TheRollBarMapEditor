import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDoodleStore } from '../doodleStore'
import { useSessionStore } from '../sessionStore'

describe('doodleStore watches activeId', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
