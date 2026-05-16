import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { mockSaveWorkspace } = vi.hoisted(() => ({
  mockSaveWorkspace: vi.fn(),
}))

vi.mock('../../storage/persist', () => ({
  saveWorkspace: mockSaveWorkspace,
}))

vi.mock('../sessionStore', () => ({
  useSessionStore: vi.fn(() => ({
    sessions: [],
    activeId: null,
  })),
}))

import { useAutoSaveStore } from '../autoSaveStore'

describe('autoSaveStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    mockSaveWorkspace.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('debounce coalescing', () => {
    it('calls saveWorkspace once after 500ms for a single call', () => {
      const store = useAutoSaveStore()
      store.scheduleAutoSave('session-1')
      vi.advanceTimersByTime(500)
      expect(mockSaveWorkspace).toHaveBeenCalledTimes(1)
    })

    it('calls saveWorkspace once for 10 rapid calls (50ms apart)', () => {
      const store = useAutoSaveStore()
      for (let i = 0; i < 10; i++) {
        store.scheduleAutoSave('session-1')
        vi.advanceTimersByTime(50)
      }
      vi.advanceTimersByTime(500)
      expect(mockSaveWorkspace).toHaveBeenCalledTimes(1)
    })

    it('calls saveWorkspace 3 times for 3 calls 600ms apart', () => {
      const store = useAutoSaveStore()
      store.scheduleAutoSave('session-1')
      vi.advanceTimersByTime(600)
      store.scheduleAutoSave('session-1')
      vi.advanceTimersByTime(600)
      store.scheduleAutoSave('session-1')
      vi.advanceTimersByTime(600)
      expect(mockSaveWorkspace).toHaveBeenCalledTimes(3)
    })
  })

  describe('cancelAutoSave', () => {
    it('prevents saveWorkspace from being called after cancel', () => {
      const store = useAutoSaveStore()
      store.scheduleAutoSave('session-1')
      store.cancelAutoSave('session-1')
      vi.advanceTimersByTime(500)
      expect(mockSaveWorkspace).not.toHaveBeenCalled()
    })

    it('is a no-op when no timer is pending for session', () => {
      const store = useAutoSaveStore()
      expect(() => store.cancelAutoSave('non-existent')).not.toThrow()
    })
  })

  describe('flushAllNow', () => {
    it('calls saveWorkspace for each pending session', () => {
      const store = useAutoSaveStore()
      store.scheduleAutoSave('session-1')
      store.scheduleAutoSave('session-2')
      store.flushAllNow()
      expect(mockSaveWorkspace).toHaveBeenCalledTimes(2)
    })

    it('clears all timers so they do not fire again after flush', () => {
      const store = useAutoSaveStore()
      store.scheduleAutoSave('session-1')
      store.scheduleAutoSave('session-2')
      store.flushAllNow()
      mockSaveWorkspace.mockClear()
      vi.advanceTimersByTime(1000)
      expect(mockSaveWorkspace).not.toHaveBeenCalled()
    })

    it('is a no-op when no sessions have pending timers', () => {
      const store = useAutoSaveStore()
      store.flushAllNow()
      expect(mockSaveWorkspace).not.toHaveBeenCalled()
    })
  })
})
