/**
 * Test helper: mount a component with the plugins it expects at runtime
 * (Vuetify, i18n, a fresh Pinia). Component specs run under happy-dom.
 */
import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createPinia } from 'pinia'
import { i18n } from '@/i18n'

export function mountComponent<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> = {},
) {
  const vuetify = createVuetify({ components, directives })
  return mount(component, {
    ...options,
    global: {
      plugins: [vuetify, i18n, createPinia()],
      ...(options.global ?? {}),
    },
  })
}
