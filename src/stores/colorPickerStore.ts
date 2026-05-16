import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { hsvToHex, hexToHsv } from '../lib/colorMath'

export const useColorPickerStore = defineStore('colorPicker', () => {
  const h = ref<number>(0)
  const s = ref<number>(1)
  const v = ref<number>(1)

  const hex = computed(() => hsvToHex(h.value, s.value, v.value))

  function setHsv(newH: number, newS: number, newV: number): void {
    h.value = newH
    s.value = newS
    v.value = newV
  }

  function setHex(value: string): void {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return
    const { h: newH, s: newS, v: newV } = hexToHsv(value)
    setHsv(newH, newS, newV)
  }

  return { h, s, v, hex, setHsv, setHex }
})
