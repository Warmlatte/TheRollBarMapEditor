import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEraseStore = defineStore('erase', () => {
  const eraseRadius = ref(1)

  return { eraseRadius }
})
