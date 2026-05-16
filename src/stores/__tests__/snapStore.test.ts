import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSnapStore } from '../snapStore'

const SNAP_KEY = 'hexmap.snap.v1'

describe('snapStore preference persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('restores mode from localStorage on init', () => {
    localStorage.setItem(SNAP_KEY, JSON.stringify({ mode: 'node' }))
    const snap = useSnapStore()
    expect(snap.snapMode).toBe('node')
  })

  it('uses default value when key is absent', () => {
    const snap = useSnapStore()
    expect(snap.snapMode).toBe('free')
  })

  it('uses default value when key contains invalid JSON', () => {
    localStorage.setItem(SNAP_KEY, '{invalid')
    const snap = useSnapStore()
    expect(snap.snapMode).toBe('free')
  })

  it('writes to localStorage when setMode is called', () => {
    const snap = useSnapStore()
    snap.setMode('node')
    const stored = JSON.parse(localStorage.getItem(SNAP_KEY)!)
    expect(stored.mode).toBe('node')
  })
})
