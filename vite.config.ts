import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Auto-import Vuetify components on demand for smaller bundles.
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Telemetry Monitor',
        short_name: 'Telemetry',
        description: 'Real-time device monitoring dashboard',
        theme_color: '#00695C',
        background_color: '#121417',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // App-shell fallback for SPA routes, but never for Firebase's reserved
        // /__/ paths (auth helpers) — keeps token flows working.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/],
        // Precache only build assets; Firestore/Auth are cross-origin API calls
        // and are intentionally never cached (always live, tokens never stale).
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
})
