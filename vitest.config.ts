import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Unit + component test config, kept separate from the app's Vite build config.
// The Vue plugin compiles SFCs for component/view specs; Vuetify is inlined so
// Vite transforms its CSS imports (Node can't import `.css` directly).
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Default to node; component specs opt into happy-dom via a
    // `// @vitest-environment happy-dom` header comment.
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
  },
})
