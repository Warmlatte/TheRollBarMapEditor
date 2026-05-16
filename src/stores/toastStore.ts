import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Toast = { id: string; message: string; type: 'info' | 'warn' | 'error' }

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function push(message: string, type: Toast['type'] = 'info'): void {
    toasts.value.push({ id: crypto.randomUUID(), message, type })
  }

  function dismiss(id: string): void {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, push, dismiss }
})
