import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useI18nStore } from '../i18nStore'
import { TOOLS } from '../../tools/registry'

const I18N_KEY = 'hexmap.i18n.v1'

describe('All tool i18nKeys have translations in both supported locales', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('所有工具 key 在 zh-TW 下不等於 key 字串本身', () => {
    const store = useI18nStore()
    store.setLocale('zh-TW')
    for (const tool of TOOLS) {
      const result = store.t(tool.i18nKey)
      expect(result).not.toBe(tool.i18nKey)
    }
  })

  it('所有工具 key 在 en 下不等於 key 字串本身', () => {
    const store = useI18nStore()
    store.setLocale('en')
    for (const tool of TOOLS) {
      const result = store.t(tool.i18nKey)
      expect(result).not.toBe(tool.i18nKey)
    }
  })

  it('zh-TW: t("tool.paint") 回傳繁中翻譯', () => {
    const store = useI18nStore()
    store.setLocale('zh-TW')
    expect(store.t('tool.paint')).not.toBe('tool.paint')
  })

  it('en: t("tool.paint") 回傳 "Paint"', () => {
    const store = useI18nStore()
    store.setLocale('en')
    expect(store.t('tool.paint')).toBe('Paint')
  })

  it('en: t("tool.erase") 回傳 "Erase"', () => {
    const store = useI18nStore()
    store.setLocale('en')
    expect(store.t('tool.erase')).toBe('Erase')
  })

  it('找不到的 key fallback 到 key 字串本身', () => {
    const store = useI18nStore()
    store.setLocale('en')
    expect(store.t('nonexistent.key')).toBe('nonexistent.key')
  })
})

describe('i18nStore preference persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('restores locale from localStorage on init', () => {
    localStorage.setItem(I18N_KEY, JSON.stringify({ locale: 'en' }))
    const store = useI18nStore()
    expect(store.locale).toBe('en')
  })

  it('uses default locale when key is absent', () => {
    const store = useI18nStore()
    expect(['zh-TW', 'en']).toContain(store.locale)
  })

  it('uses default locale when key contains invalid JSON', () => {
    localStorage.setItem(I18N_KEY, '{invalid')
    const store = useI18nStore()
    expect(['zh-TW', 'en']).toContain(store.locale)
  })

  it('writes to localStorage when setLocale is called', () => {
    const store = useI18nStore()
    store.setLocale('en')
    const stored = JSON.parse(localStorage.getItem(I18N_KEY)!)
    expect(stored.locale).toBe('en')
  })
})
