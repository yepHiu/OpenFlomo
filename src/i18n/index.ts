import { createI18n } from 'vue-i18n'
import zhCN from '../locales/zh-CN.json'
import en from '../locales/en.json'

type Locale = 'zh-CN' | 'en'

// 获取保存的语言设置，没有则使用简体中文
function getSavedLocale(): Locale {
  const saved = localStorage.getItem('locale')
  return (saved === 'en' ? 'en' : 'zh-CN') as Locale
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en': en
  }
})

// 切换语言
export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
}

// 获取当前语言
export function getLocale(): Locale {
  return i18n.global.locale.value as Locale
}
