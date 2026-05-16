import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Locale = 'zh-TW' | 'en'

type Messages = Record<string, string>
type Dictionary = Record<Locale, Messages>

const messages: Dictionary = {
  'zh-TW': {
    'tool.paint':  '塗色',
    'tool.icon':   '圖示',
    'tool.line':   '線條',
    'tool.doodle': '塗鴉',
    'tool.erase':  '擦除',
  },
  'en': {
    'tool.paint':  'Paint',
    'tool.icon':   'Icon',
    'tool.line':   'Line',
    'tool.doodle': 'Doodle',
    'tool.erase':  'Erase',
  },
}

function detectLocale(): Locale {
  const lang = navigator.language
  if (lang.startsWith('zh')) return 'zh-TW'
  return 'en'
}

export const useI18nStore = defineStore('i18n', () => {
  const locale = ref<Locale>(detectLocale())

  const dict = computed(() => messages[locale.value])

  function t(key: string): string {
    return dict.value[key] ?? messages['en'][key] ?? key
  }

  function setLocale(l: Locale) {
    locale.value = l
  }

  return { locale, t, setLocale }
})
