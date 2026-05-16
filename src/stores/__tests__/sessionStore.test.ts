import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '../sessionStore'
import { useArchiveStore } from '../archiveStore'
import type { MapData } from '../../data/types'

vi.mock('../../lib/fileLock', () => ({
  fileLock: {
    broadcastLock: vi.fn(),
    broadcastUnlock: vi.fn(),
    isLockedByOtherTab: vi.fn(() => false),
  },
}))

const emptyMapData: MapData = {
  name: 'Test',
  bounds: { radius: 3 },
  hexes: [],
  icons: [],
  lines: [],
  doodles: [],
}

describe('sessionStore.createSessionFromArchive', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('switches to existing session when id matches', () => {
    const store = useSessionStore()
    const s = store.makeSession()
    store.setActive(s.id)
    const entry = {
      id: s.id,
      name: 'Test',
      mapData: emptyMapData,
      fileHandle: null,
      order: 1,
    }
    const result = store.createSessionFromArchive(entry)
    expect(store.sessions.length).toBe(1)
    expect(store.activeId).toBe(s.id)
    expect(result.id).toBe(s.id)
  })

  it('creates new session with entry.id when not already open', () => {
    const store = useSessionStore()
    const entry = {
      id: 'archive-uuid-1234',
      name: 'Archived Map',
      mapData: emptyMapData,
      fileHandle: null,
      order: 1,
    }
    const result = store.createSessionFromArchive(entry)
    expect(result.id).toBe('archive-uuid-1234')
    expect(store.sessions.some((s) => s.id === 'archive-uuid-1234')).toBe(true)
  })

  it('does not increase sessions.length when reopening existing', () => {
    const store = useSessionStore()
    const s = store.makeSession()
    const entry = {
      id: s.id,
      name: 'Test',
      mapData: emptyMapData,
      fileHandle: null,
      order: 1,
    }
    const before = store.sessions.length
    store.createSessionFromArchive(entry)
    expect(store.sessions.length).toBe(before)
  })
})

describe('sessionStore.createSessionFromFile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('creates a new session with the given mapFile and handle', async () => {
    const { fileLock } = await import('../../lib/fileLock')
    vi.mocked(fileLock.isLockedByOtherTab).mockReturnValue(false)
    const store = useSessionStore()
    const result = await store.createSessionFromFile(emptyMapData, '/maps/test.trbm')
    expect(result).not.toBeNull()
    expect(store.sessions.length).toBe(1)
    expect(store.sessions[0].fileHandle).toBe('/maps/test.trbm')
  })

  it('switches to existing session if same handle is already open', async () => {
    const { fileLock } = await import('../../lib/fileLock')
    vi.mocked(fileLock.isLockedByOtherTab).mockReturnValue(false)
    const store = useSessionStore()
    const first = await store.createSessionFromFile(emptyMapData, '/maps/dup.trbm')
    const second = await store.createSessionFromFile(emptyMapData, '/maps/dup.trbm')
    expect(store.sessions.length).toBe(1)
    expect(store.activeId).toBe(first?.id)
    expect(second?.id).toBe(first?.id)
  })

  it('returns null if file is locked by another tab', async () => {
    const { fileLock } = await import('../../lib/fileLock')
    vi.mocked(fileLock.isLockedByOtherTab).mockReturnValue(true)
    const store = useSessionStore()
    const result = await store.createSessionFromFile(emptyMapData, '/maps/locked.trbm')
    expect(result).toBeNull()
    expect(store.sessions.length).toBe(0)
  })

  it('broadcasts lock on successful file open', async () => {
    const { fileLock } = await import('../../lib/fileLock')
    vi.mocked(fileLock.isLockedByOtherTab).mockReturnValue(false)
    const store = useSessionStore()
    await store.createSessionFromFile(emptyMapData, '/maps/new.trbm')
    expect(fileLock.broadcastLock).toHaveBeenCalledWith('/maps/new.trbm')
  })
})

describe('sessionStore.closeSession - file lock broadcast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('broadcasts unlock when closing a session with a fileHandle', async () => {
    const { fileLock } = await import('../../lib/fileLock')
    const store = useSessionStore()
    const s = store.makeSession()
    // Simulate session having a fileHandle (string path for fallback adapter)
    const session = store.sessions.find((x) => x.id === s.id)!
    session.fileHandle = '/maps/dungeon.trbm'
    store.closeSession(s.id)
    expect(fileLock.broadcastUnlock).toHaveBeenCalledWith('/maps/dungeon.trbm')
  })

  it('does not broadcast unlock for blank session (no fileHandle)', async () => {
    const { fileLock } = await import('../../lib/fileLock')
    const store = useSessionStore()
    const s = store.makeSession()
    store.closeSession(s.id)
    expect(fileLock.broadcastUnlock).not.toHaveBeenCalled()
  })
})

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
