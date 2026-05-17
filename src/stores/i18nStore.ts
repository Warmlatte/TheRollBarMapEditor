import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Locale = 'zh-TW' | 'en'

type Messages = Record<string, string>
type Dictionary = Record<Locale, Messages>

const messages: Dictionary = {
  'zh-TW': {
    'tool.paint':    '塗色',
    'tool.icon':     '圖示',
    'tool.line':     '線條',
    'tool.doodle':   '塗鴉',
    'tool.erase':    '擦除',
    'icon.upload':   '上傳圖示',
    'icon.delete':   '刪除',
    'icon.empty':    '尚無圖示',
    'icon.size':     '大小',
    'icon.rotation': '旋轉',
    'icon.color':    '顏色',
  },
  'en': {
    'tool.paint':    'Paint',
    'tool.icon':     'Icon',
    'tool.line':     'Line',
    'tool.doodle':   'Doodle',
    'tool.erase':    'Erase',
    'icon.upload':   'Upload Icon',
    'icon.delete':   'Delete',
    'icon.empty':    'No icons yet',
    'icon.size':     'Size',
    'icon.rotation': 'Rotation',
    'icon.color':    'Color',
  },
}

const PREF_KEY = 'hexmap.i18n.v1'

function detectLocale(): Locale {
  const lang = navigator.language
  if (lang.startsWith('zh')) return 'zh-TW'
  return 'en'
}

function loadPref(): Locale {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw === null) return detectLocale()
    const parsed = JSON.parse(raw) as { locale: Locale }
    return parsed.locale === 'en' ? 'en' : 'zh-TW'
  } catch {
    return detectLocale()
  }
}

function savePref(locale: Locale): void {
  localStorage.setItem(PREF_KEY, JSON.stringify({ locale }))
}

export const useI18nStore = defineStore('i18n', () => {
  const locale = ref<Locale>(loadPref())

  const dict = computed(() => messages[locale.value])

  function t(key: string): string {
    return dict.value[key] ?? messages['en'][key] ?? key
  }

  function setLocale(l: Locale) {
    locale.value = l
    savePref(locale.value)
  }

  return { locale, t, setLocale }
})
