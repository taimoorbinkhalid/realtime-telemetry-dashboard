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
    // Hermetic, non-secret Firebase config so component specs that transitively
    // import firebase.ts don't depend on a local .env (and never hit CI's lack of one).
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '0',
      VITE_FIREBASE_APP_ID: 'test-app-id',
      VITE_DEMO_EMAIL: 'demo@example.com',
      VITE_DEMO_PASSWORD: 'demo1234',
    },
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
  },
})
