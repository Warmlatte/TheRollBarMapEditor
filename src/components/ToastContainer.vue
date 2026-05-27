<script setup lang="ts">
import { useToastStore } from '../stores/toastStore'
import type { ToastKind } from '../stores/toastStore'

const store = useToastStore()

const baseItemClass = "inline-flex items-center gap-2.5 py-2 pr-3.5 pl-2.5 rounded-md border text-[#e8dcc4] text-sm font-medium leading-[1.4] cursor-pointer max-w-xs select-none shadow-[0_4px_16px_rgba(0,0,0,0.5)] bg-[rgba(20,20,20,0.85)] backdrop-blur-md before:content-[''] before:w-2 before:h-2 before:rounded-full before:shrink-0"

const kindClass: Record<ToastKind, string> = {
  error:   'toast-error',
  warning: 'toast-warning',
  info:    'toast-info',
  success: 'toast-success',
}
</script>

<template>
  <div
    data-testid="toast-container"
    class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
  >
    <div
      v-for="toast in [...store.toasts].reverse()"
      :key="toast.id"
      :data-testid="`toast-item-${toast.id}`"
      :class="[baseItemClass, kindClass[toast.kind]]"
      @click="store.dismissToast(toast.id)"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.toast-item {
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  max-width: 320px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  user-select: none;
}

.toast-error   { background: #dc2626; }
.toast-warning { background: #d97706; }
.toast-info    { background: #2563eb; }
.toast-success { background: #16a34a; }
</style>
