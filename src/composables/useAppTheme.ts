/**
 * Theme toggle composable. Wraps Vuetify's theme API and persists the choice to
 * localStorage so the selection survives reloads.
 */
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { THEME_STORAGE_KEY } from '@/plugins/vuetify'

export function useAppTheme() {
  const theme = useTheme()

  const isDark = computed(() => theme.global.current.value.dark)

  function toggle(): void {
    const next = isDark.value ? 'light' : 'dark'
    theme.global.name.value = next
    localStorage.setItem(THEME_STORAGE_KEY, next)
  }

  return { isDark, toggle }
}
