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
    localStorage.setItem(ERASE_KEY, JSON.stringify({ radius: 80 }))
    const erase = useEraseStore()
    expect(erase.eraseRadius).toBe(80)
  })

  it('uses default value when key is absent', () => {
    const erase = useEraseStore()
    expect(erase.eraseRadius).toBe(35)
  })

  it('uses default value when key contains invalid JSON', () => {
    localStorage.setItem(ERASE_KEY, '{invalid')
    const erase = useEraseStore()
    expect(erase.eraseRadius).toBe(35)
  })

  it('writes to localStorage when setRadius is called', () => {
    const erase = useEraseStore()
    erase.setRadius(80)
    const stored = JSON.parse(localStorage.getItem(ERASE_KEY)!)
    expect(stored.radius).toBe(80)
  })

  it('writes targets to localStorage when toggleTarget is called', () => {
    const erase = useEraseStore()
    erase.toggleTarget('hex')

    const stored = JSON.parse(localStorage.getItem(ERASE_KEY)!)
    expect(stored.targets.hex).toBe(false)
  })

  it('restores targets from localStorage on init', () => {
    localStorage.setItem(ERASE_KEY, JSON.stringify({
      radius: 80,
      targets: { hex: false, icon: true, line: false, doodle: true },
    }))

    const erase = useEraseStore()

    expect(erase.targets).toEqual({
      hex: false,
      icon: true,
      line: false,
      doodle: true,
    })
  })

  it('missing targets key defaults to true', () => {
    localStorage.setItem(ERASE_KEY, JSON.stringify({
      radius: 80,
      targets: { hex: false },
    }))

    const erase = useEraseStore()

    expect(erase.targets).toEqual({
      hex: false,
      icon: true,
      line: true,
      doodle: true,
    })
  })

  it('uses fresh target defaults for each store instance', () => {
    const first = useEraseStore()
    first.targets.hex = false
    first.targets.icon = false

    setActivePinia(createPinia())
    localStorage.clear()
    const second = useEraseStore()

    expect(second.targets).toEqual({
      hex: true,
      icon: true,
      line: true,
      doodle: true,
    })
  })

  it('setRadius(0) clamps to 5', () => {
    const erase = useEraseStore()

    erase.setRadius(0)

    expect(erase.radius).toBe(5)
  })

  it('setRadius(999) clamps to 200', () => {
    const erase = useEraseStore()

    erase.setRadius(999)

    expect(erase.radius).toBe(200)
  })

  it.each([
    [0, 5],
    [4, 5],
    [5, 5],
    [100, 100],
    [200, 200],
    [201, 200],
    [999, 200],
  ])('setRadius(%i) stores %i', (input, expected) => {
    const erase = useEraseStore()

    erase.setRadius(input)

    expect(erase.radius).toBe(expected)
  })

  it('selectAllTargets sets all four targets to true and persists', () => {
    const erase = useEraseStore()
    erase.toggleTarget('hex')
    erase.toggleTarget('line')

    erase.selectAllTargets()

    expect(erase.targets).toEqual({
      hex: true,
      icon: true,
      line: true,
      doodle: true,
    })
    const stored = JSON.parse(localStorage.getItem(ERASE_KEY)!)
    expect(stored.targets).toEqual({
      hex: true,
      icon: true,
      line: true,
      doodle: true,
    })
  })
})
