import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '../sessionStore'
import { useArchiveStore } from '../archiveStore'
import type { MapData } from '../../data/types'

const emptyMapData: MapData = {
  name: 'Test',
  bounds: { radius: 3 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

describe('sessionStore.markSessionDirty', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets isDirty to true', () => {
    const store = useSessionStore()
    const s = store.makeSession()
    store.markSessionDirty(s.id)
    expect(store.sessions.find((x) => x.id === s.id)?.isDirty).toBe(true)
  })

  it('calls archiveStore.claimSession with the session', async () => {
    const store = useSessionStore()
    const archive = useArchiveStore()
    const claimSpy = vi.spyOn(archive, 'claimSession')
    const s = store.makeSession()
    await store.markSessionDirty(s.id)
    expect(claimSpy).toHaveBeenCalledWith(expect.objectContaining({ id: s.id }))
  })
})

describe('sessionStore.renameSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('updates session name', () => {
    const store = useSessionStore()
    const s = store.makeSession()
    store.renameSession(s.id, 'Dungeon Level 1')
    expect(store.sessions.find((x) => x.id === s.id)?.name).toBe('Dungeon Level 1')
  })

  it('sets isDirty to true after rename', () => {
    const store = useSessionStore()
    const s = store.makeSession()
    store.renameSession(s.id, 'Renamed')
    expect(store.sessions.find((x) => x.id === s.id)?.isDirty).toBe(true)
  })
})

describe('sessionStore.setActive + activeSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('activeSession follows activeId', () => {
    const store = useSessionStore()
    const s1 = store.makeSession()
    const s2 = store.makeSession()
    store.setActive(s1.id)
    expect(store.activeSession?.id).toBe(s1.id)
    store.setActive(s2.id)
    expect(store.activeSession?.id).toBe(s2.id)
  })

  it('activeSession is null when activeId is null', () => {
    const store = useSessionStore()
    store.makeSession()
    expect(store.activeSession).toBeNull()
  })

  it('setActive updates activeId', () => {
    const store = useSessionStore()
    const s = store.makeSession()
    store.setActive(s.id)
    expect(store.activeId).toBe(s.id)
  })
})

describe('sessionStore.closeSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('removes the session from sessions', () => {
    const store = useSessionStore()
    const s1 = store.makeSession()
    const s2 = store.makeSession()
    store.closeSession(s1.id)
    expect(store.sessions.find((s) => s.id === s1.id)).toBeUndefined()
    expect(store.sessions.find((s) => s.id === s2.id)).toBeDefined()
  })

  it('closing the last session auto-creates a blank replacement', () => {
    const store = useSessionStore()
    const s = store.makeSession()
    store.closeSession(s.id)
    expect(store.sessions.length).toBe(1)
    expect(store.sessions[0].id).not.toBe(s.id)
  })

  it('sessions.length decreases by 1 when not the last', () => {
    const store = useSessionStore()
    store.makeSession()
    store.makeSession()
    expect(store.sessions.length).toBe(2)
    store.closeSession(store.sessions[0].id)
    expect(store.sessions.length).toBe(1)
  })
})

describe('sessionStore.makeSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('new session has empty undoStack', () => {
    const store = useSessionStore()
    const session = store.makeSession()
    expect(session.undoStack.length).toBe(0)
  })

  it('new session has empty redoStack', () => {
    const store = useSessionStore()
    const session = store.makeSession()
    expect(session.redoStack.length).toBe(0)
  })

  it('new session with initialMapData still has empty stacks', () => {
    const store = useSessionStore()
    const session = store.makeSession(emptyMapData)
    expect(session.undoStack.length).toBe(0)
    expect(session.redoStack.length).toBe(0)
  })

  it('new session is added to sessions array', () => {
    const store = useSessionStore()
    const session = store.makeSession()
    expect(store.sessions.some((s) => s.id === session.id)).toBe(true)
  })

  it('session id is a uuid', () => {
    const store = useSessionStore()
    const session = store.makeSession()
    expect(session.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('session isDirty starts false', () => {
    const store = useSessionStore()
    const session = store.makeSession()
    expect(session.isDirty).toBe(false)
  })
})
