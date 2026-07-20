<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDevicesStore } from '@/stores/devices'
import { useAlertsStore } from '@/stores/alerts'
import { useUserStore } from '@/stores/user'
import { useAppTheme } from '@/composables/useAppTheme'
import NotificationBell from '@/components/NotificationBell.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const devices = useDevicesStore()
const alerts = useAlertsStore()
const user = useUserStore()
const { isDark, toggle } = useAppTheme()

const showBar = computed(() => auth.isAuthenticated)

// Open shared subscriptions once authenticated; tear them down on sign-out.
watch(
  () => auth.isAuthenticated,
  (authed) => {
    if (authed) {
      alerts.subscribe()
      if (auth.user) user.subscribe(auth.user.uid)
    } else {
      alerts.reset()
      user.reset()
    }
  },
  { immediate: true },
)

async function onSignOut(): Promise<void> {
  devices.reset()
  alerts.reset()
  user.reset()
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
        <NotificationBell />
        <LanguageSwitcher />
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

      <template #extension>
        <v-tabs density="comfortable">
          <v-tab :to="{ name: 'overview' }" prepend-icon="mdi-view-dashboard-outline">
            {{ t('nav.overview') }}
          </v-tab>
          <v-tab :to="{ name: 'dashboard' }" prepend-icon="mdi-devices">
            {{ t('nav.devices') }}
          </v-tab>
          <v-tab :to="{ name: 'alerts' }" prepend-icon="mdi-bell-outline">
            {{ t('nav.alerts') }}
          </v-tab>
          <v-tab :to="{ name: 'settings' }" prepend-icon="mdi-cog-outline">
            {{ t('nav.settings') }}
          </v-tab>
        </v-tabs>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
