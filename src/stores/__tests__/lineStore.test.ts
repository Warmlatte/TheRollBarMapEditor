import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLineStore } from '../lineStore'
import { useSessionStore } from '../sessionStore'

describe('lineStore watches activeId', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
