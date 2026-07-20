import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit-test config, kept separate from the app's Vite build config.
// Tests here exercise pure logic and Pinia stores, so a Node environment is
// enough — no jsdom / component mounting required.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    globals: true,
  },
})
