import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { hsvToHex, hexToHsv } from '../lib/colorMath'
import { DEFAULT_TOOL_COLOR } from './brushStore'

const DEFAULT_HSV = hexToHsv(DEFAULT_TOOL_COLOR)

export const useColorPickerStore = defineStore('colorPicker', () => {
  const h = ref<number>(DEFAULT_HSV.h)
  const s = ref<number>(DEFAULT_HSV.s)
  const v = ref<number>(DEFAULT_HSV.v)

  const hex = computed(() => hsvToHex(h.value, s.value, v.value))

  const hexInput = ref<string>(DEFAULT_TOOL_COLOR)
  let _suppressNextSync = false

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

  function applyHex(hex: string): void {
    const { h: newH, s: newS, v: newV } = hexToHsv(hex)
    h.value = newH
    s.value = newS
    v.value = newV
    hexInput.value = hex
    _suppressNextSync = true
  }

  function consumeSuppressFlag(): boolean {
    if (_suppressNextSync) {
      _suppressNextSync = false
      return true
    }
    return false
  }

  function setHexInput(value: string): void {
    hexInput.value = value
  }

  return { h, s, v, hex, hexInput, setHsv, setHex, applyHex, consumeSuppressFlag, setHexInput }
})
