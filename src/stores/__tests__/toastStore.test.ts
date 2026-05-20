import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore, DEFAULT_DURATION_MS } from '../toastStore'

describe('toastStore — Toast kinds and display duration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pushToast adds toast to list', () => {
    const store = useToastStore()
    store.pushToast('hello', 'info')
    expect(store.toasts.length).toBe(1)
    expect(store.toasts[0].message).toBe('hello')
  })

  it('DEFAULT_DURATION_MS has correct values for each kind', () => {
    expect(DEFAULT_DURATION_MS.error).toBe(6000)
    expect(DEFAULT_DURATION_MS.warning).toBe(5000)
    expect(DEFAULT_DURATION_MS.info).toBe(4000)
    expect(DEFAULT_DURATION_MS.success).toBe(4000)
  })

  it('error toast auto-dismisses after 6000ms', () => {
    const store = useToastStore()
    store.pushToast('err', 'error')
    expect(store.toasts.length).toBe(1)
    vi.advanceTimersByTime(5999)
    expect(store.toasts.length).toBe(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts.length).toBe(0)
  })

  it('warning toast auto-dismisses after 5000ms', () => {
    const store = useToastStore()
    store.pushToast('warn', 'warning')
    vi.advanceTimersByTime(4999)
    expect(store.toasts.length).toBe(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts.length).toBe(0)
  })

  it('info toast auto-dismisses after 4000ms', () => {
    const store = useToastStore()
    store.pushToast('info', 'info')
    vi.advanceTimersByTime(3999)
    expect(store.toasts.length).toBe(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts.length).toBe(0)
  })

  it('success toast auto-dismisses after 4000ms', () => {
    const store = useToastStore()
    store.pushToast('ok', 'success')
    vi.advanceTimersByTime(3999)
    expect(store.toasts.length).toBe(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts.length).toBe(0)
  })
})

describe('toastStore — pushToast API', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pushToast returns a string id', () => {
    const store = useToastStore()
    const id = store.pushToast('Saved', 'success')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returned id matches toast in list', () => {
    const store = useToastStore()
    const id = store.pushToast('Saved', 'success')
    expect(store.toasts.find((t) => t.id === id)).toBeDefined()
  })

  it('pushToast defaults kind to info when omitted', () => {
    const store = useToastStore()
    store.pushToast('Done')
    expect(store.toasts[0].kind).toBe('info')
  })

  it('pushToast with durationMs=0 does not auto-dismiss', () => {
    const store = useToastStore()
    store.pushToast('Persistent', 'info', 0)
    vi.advanceTimersByTime(60000)
    expect(store.toasts.length).toBe(1)
  })
})

describe('toastStore — Toast stacking and ordering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('three pushToasts yields three toasts in the list', () => {
    const store = useToastStore()
    store.pushToast('A', 'info')
    store.pushToast('B', 'success')
    store.pushToast('C', 'error')
    expect(store.toasts.length).toBe(3)
  })

  it('toasts are appended in push order', () => {
    const store = useToastStore()
    store.pushToast('A', 'info')
    store.pushToast('B', 'success')
    store.pushToast('C', 'error')
    expect(store.toasts[0].message).toBe('A')
    expect(store.toasts[1].message).toBe('B')
    expect(store.toasts[2].message).toBe('C')
  })

  it('each toast has its own independent timer', () => {
    const store = useToastStore()
    store.pushToast('A', 'info')    // 4000ms
    store.pushToast('B', 'error')   // 6000ms
    store.pushToast('C', 'warning') // 5000ms

    vi.advanceTimersByTime(4000)
    expect(store.toasts.length).toBe(2)
    expect(store.toasts.find((t) => t.message === 'A')).toBeUndefined()

    vi.advanceTimersByTime(1000)
    expect(store.toasts.length).toBe(1)
    expect(store.toasts.find((t) => t.message === 'C')).toBeUndefined()

    vi.advanceTimersByTime(1000)
    expect(store.toasts.length).toBe(0)
  })
})

describe('toastStore — Dismiss toast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('dismissToast removes the toast with given id', () => {
    const store = useToastStore()
    const id = store.pushToast('msg', 'info', 0)
    expect(store.toasts.length).toBe(1)
    store.dismissToast(id)
    expect(store.toasts.length).toBe(0)
  })

  it('dismissToast on nonexistent id does not throw and list is unchanged', () => {
    const store = useToastStore()
    store.pushToast('msg', 'info', 0)
    expect(() => store.dismissToast('nonexistent')).not.toThrow()
    expect(store.toasts.length).toBe(1)
  })
})

describe('toastStore — clearToasts for test reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('clearToasts empties all toasts synchronously', () => {
    const store = useToastStore()
    store.pushToast('A', 'info', 0)
    store.pushToast('B', 'success', 0)
    store.pushToast('C', 'error', 0)
    expect(store.toasts.length).toBe(3)
    store.clearToasts()
    expect(store.toasts.length).toBe(0)
  })
})
