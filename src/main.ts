import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { vuetify } from './plugins/vuetify'
import { i18n } from './i18n'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(vuetify)
app.use(i18n)

// Start listening for auth state before the router mounts so guards can await
// the initial check (see stores/auth.ts and router/index.ts).
useAuthStore().init()

app.use(router)
app.mount('#app')
