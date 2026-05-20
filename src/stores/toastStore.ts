import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'error' | 'warning' | 'info' | 'success'

export const DEFAULT_DURATION_MS: Record<ToastKind, number> = {
  error: 6000,
  warning: 5000,
  info: 4000,
  success: 4000,
}

export type Toast = {
  id: string
  message: string
  kind: ToastKind
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function pushToast(message: string, kind: ToastKind = 'info', durationMs?: number): string {
    const id = crypto.randomUUID()
    toasts.value.push({ id, message, kind })

    const duration = durationMs !== undefined ? durationMs : DEFAULT_DURATION_MS[kind]
    if (duration !== 0) {
      setTimeout(() => dismissToast(id), duration)
    }

    return id
  }

  function dismissToast(id: string): void {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function clearToasts(): void {
    toasts.value.splice(0)
  }

  return { toasts, pushToast, dismissToast, clearToasts }
})
