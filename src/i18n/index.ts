/**
 * i18n setup. Currently ships English only, but all UI text is keyed so adding
 * a locale is a matter of dropping in another file under `locales/`.
 */
import { createI18n } from 'vue-i18n'
import en from './locales/en'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
})
