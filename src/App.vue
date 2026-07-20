<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDevicesStore } from '@/stores/devices'
import { useAppTheme } from '@/composables/useAppTheme'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const devices = useDevicesStore()
const { isDark, toggle } = useAppTheme()

const showBar = computed(() => auth.isAuthenticated)

async function onSignOut(): Promise<void> {
  devices.reset()
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <v-app>
    <v-app-bar v-if="showBar" flat border density="comfortable">
      <v-app-bar-title>
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-chart-line-variant" color="primary" />
          <span class="font-weight-bold">{{ t('app.title') }}</span>
        </div>
      </v-app-bar-title>

      <template #append>
        <v-btn
          :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          :aria-label="t('actions.toggleTheme')"
          variant="text"
          @click="toggle"
        />
        <v-btn variant="text" prepend-icon="mdi-logout" @click="onSignOut">
          {{ t('actions.signOut') }}
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
