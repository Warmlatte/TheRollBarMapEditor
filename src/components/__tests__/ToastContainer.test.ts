import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useToastStore } from '../../stores/toastStore'
import type { ToastKind } from '../../stores/toastStore'

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

  it('renders toast items with the required Tailwind base classes', async () => {
    const store = useToastStore()
    store.pushToast('Styled toast', 'info', 0)
    const wrapper = await mountContainer(pinia)
    await wrapper.vm.$nextTick()

    const toastEl = wrapper.get('[data-testid^="toast-item"]')
    expect(toastEl.classes()).toEqual(
      expect.arrayContaining([
        'inline-flex',
        'items-center',
        'gap-2.5',
        'py-2',
        'pr-3.5',
        'pl-2.5',
        'rounded-md',
        'border',
        'text-[#e8dcc4]',
        'text-sm',
        'font-medium',
        'leading-[1.4]',
        'cursor-pointer',
        'max-w-xs',
        'select-none',
        'shadow-[0_4px_16px_rgba(0,0,0,0.5)]',
        'bg-[rgba(20,20,20,0.85)]',
        'backdrop-blur-md',
        "before:content-['']",
        'before:w-2',
        'before:h-2',
        'before:rounded-full',
        'before:shrink-0',
      ]),
    )
    expect(toastEl.attributes('style')).toBeUndefined()
    wrapper.unmount()
  })

  it.each([
    [
      'error',
      [
        'border-[rgba(194,90,74,0.45)]',
        'before:bg-[#c25a4a]',
        'before:shadow-[0_0_8px_rgba(194,90,74,0.6)]',
      ],
    ],
    [
      'warning',
      [
        'border-[rgba(212,181,110,0.5)]',
        'before:bg-[#d4b56e]',
        'before:shadow-[0_0_8px_rgba(212,181,110,0.55)]',
      ],
    ],
    [
      'info',
      [
        'border-[rgba(74,122,138,0.5)]',
        'before:bg-[#4a7a8a]',
        'before:shadow-[0_0_8px_rgba(74,122,138,0.55)]',
      ],
    ],
    [
      'success',
      [
        'border-[rgba(106,154,82,0.45)]',
        'before:bg-[#6a9a52]',
        'before:shadow-[0_0_8px_rgba(106,154,82,0.55)]',
      ],
    ],
  ] satisfies Array<[ToastKind, string[]]>)('renders %s toasts with type-specific Tailwind classes', async (kind, classes) => {
    const store = useToastStore()
    store.pushToast(`${kind} toast`, kind, 0)
    const wrapper = await mountContainer(pinia)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid^="toast-item"]').classes()).toEqual(expect.arrayContaining(classes))
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

  it('container uses Tailwind positioning classes and disables pointer events', async () => {
    const wrapper = await mountContainer(pinia)
    const container = wrapper.find('[data-testid="toast-container"]')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toEqual(
      expect.arrayContaining([
        'fixed',
        'bottom-4',
        'right-4',
        'z-[9999]',
        'flex',
        'flex-col',
        'gap-2',
        'items-end',
        'pointer-events-none',
      ]),
    )
    expect(container.attributes('style')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('ToastContainer — styling architecture', () => {
  it('does not define scoped CSS styles', () => {
    const source = readFileSync(resolve(__dirname, '../ToastContainer.vue'), 'utf-8')

    expect(source).not.toContain('<style scoped>')
  })
})
