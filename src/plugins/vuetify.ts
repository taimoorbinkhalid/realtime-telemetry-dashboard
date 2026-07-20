/**
 * Vuetify setup. Registers the light/dark themes defined in `theme.ts` and
 * chooses the initial theme from the user's saved preference or OS setting.
 */
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { darkTheme, lightTheme } from './theme'

const THEME_STORAGE_KEY = 'telemetry-demo:theme'

/** Resolve the theme to start with: saved choice → OS preference → light. */
function initialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export const vuetify = createVuetify({
  theme: {
    defaultTheme: initialTheme(),
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VCard: { rounded: 'lg' },
    VBtn: { rounded: 'lg' },
  },
})

export { THEME_STORAGE_KEY }
