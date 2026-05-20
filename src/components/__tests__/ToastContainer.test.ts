import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useToastStore } from '../../stores/toastStore'

async function mountContainer(pinia: ReturnType<typeof createPinia>) {
  const { default: ToastContainer } = await import('../ToastContainer.vue')
  return mount(ToastContainer, { global: { plugins: [pinia] } })
}

describe('ToastContainer — rendering', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders message text after pushToast', async () => {
    const store = useToastStore()
    store.pushToast('File saved', 'success', 0)
    const wrapper = await mountContainer(pinia)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('File saved')
    wrapper.unmount()
  })

  it('renders multiple toasts', async () => {
    const store = useToastStore()
    store.pushToast('First', 'info', 0)
    store.pushToast('Second', 'error', 0)
    const wrapper = await mountContainer(pinia)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('First')
    expect(wrapper.text()).toContain('Second')
    wrapper.unmount()
  })

  it('renders no toasts when list is empty', async () => {
    const wrapper = await mountContainer(pinia)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[data-testid^="toast-item"]').length).toBe(0)
    wrapper.unmount()
  })
})

describe('ToastContainer — dismiss on click', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clicking a toast removes it from the DOM', async () => {
    const store = useToastStore()
    store.pushToast('Click me', 'info', 0)
    const wrapper = await mountContainer(pinia)
    await wrapper.vm.$nextTick()

    const toastEl = wrapper.find('[data-testid^="toast-item"]')
    expect(toastEl.exists()).toBe(true)
    await toastEl.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-testid^="toast-item"]').length).toBe(0)
    wrapper.unmount()
  })
})

describe('ToastContainer — pointer events', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('container has pointer-events: none', async () => {
    const wrapper = await mountContainer(pinia)
    const container = wrapper.find('[data-testid="toast-container"]')
    expect(container.exists()).toBe(true)
    expect(container.attributes('style') ?? '').toContain('pointer-events: none')
    wrapper.unmount()
  })
})
