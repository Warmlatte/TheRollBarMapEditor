import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEraseStore } from '../eraseStore'

const ERASE_KEY = 'hexmap.erase.v1'

describe('eraseStore preference persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('restores radius from localStorage on init', () => {
    localStorage.setItem(ERASE_KEY, JSON.stringify({ radius: 3 }))
    const erase = useEraseStore()
    expect(erase.eraseRadius).toBe(3)
  })

  it('uses default value when key is absent', () => {
    const erase = useEraseStore()
    expect(erase.eraseRadius).toBe(1)
  })

  it('uses default value when key contains invalid JSON', () => {
    localStorage.setItem(ERASE_KEY, '{invalid')
    const erase = useEraseStore()
    expect(erase.eraseRadius).toBe(1)
  })

  it('writes to localStorage when setRadius is called', () => {
    const erase = useEraseStore()
    erase.setRadius(4)
    const stored = JSON.parse(localStorage.getItem(ERASE_KEY)!)
    expect(stored.radius).toBe(4)
  })
})
