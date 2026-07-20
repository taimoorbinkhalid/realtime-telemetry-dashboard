/**
 * i18n setup. Ships English plus five additional locales; the active locale is
 * resolved from a saved choice, then the browser language, then English, and
 * persisted on change. Adding a locale is a matter of dropping a file under
 * `locales/` and registering it here.
 */
import { createI18n } from 'vue-i18n'
import en from './locales/en'
import de from './locales/de'
import fr from './locales/fr'
import pl from './locales/pl'
import it from './locales/it'
import es from './locales/es'

export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'pl', 'it', 'es'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

/** Native endonyms for the language switcher. */
export const LOCALE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  pl: 'Polski',
  it: 'Italiano',
  es: 'Español',
}

const LOCALE_STORAGE_KEY = 'telemetry-demo:locale'

function isSupported(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/** Resolve the starting locale: saved choice → browser language → English. */
function initialLocale(): AppLocale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (saved && isSupported(saved)) return saved
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en'
  return isSupported(nav) ? nav : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { en, de, fr, pl, it, es },
})

/** Switch the active locale, persist it, and update <html lang>. */
export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', locale)
}
