/**
 * Central theme tokens. All brand colors live here (never inline hex in
 * components), so light/dark stay in sync and a rebrand is a one-file change.
 */
import type { ThemeDefinition } from 'vuetify'

/** Semantic status colors, shared by both themes and by chart rendering. */
export const statusColors = {
  online: '#2E7D32',
  warning: '#F9A825',
  offline: '#C62828',
} as const

const brand = {
  primary: '#00695C',
  secondary: '#4DD0E1',
  accent: '#26A69A',
}

export const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F4F6F8',
    surface: '#FFFFFF',
    primary: brand.primary,
    secondary: brand.secondary,
    accent: brand.accent,
    error: statusColors.offline,
    warning: statusColors.warning,
    success: statusColors.online,
    info: '#0277BD',
  },
}

export const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#121417',
    surface: '#1E2226',
    primary: brand.secondary,
    secondary: brand.accent,
    accent: brand.secondary,
    error: '#EF5350',
    warning: '#FFB300',
    success: '#66BB6A',
    info: '#4FC3F7',
  },
}
