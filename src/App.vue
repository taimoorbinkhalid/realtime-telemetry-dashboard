<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useDevicesStore } from '@/stores/devices'
import { useAlertsStore } from '@/stores/alerts'
import { useUserStore } from '@/stores/user'
import { useAppTheme } from '@/composables/useAppTheme'
import NotificationBell from '@/components/NotificationBell.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const { smAndDown, xs } = useDisplay()
const auth = useAuthStore()
const devices = useDevicesStore()
const alerts = useAlertsStore()
const user = useUserStore()
const { isDark, toggle } = useAppTheme()

const showBar = computed(() => auth.isAuthenticated)

// Single source of nav items for both the desktop tabs and the mobile
// bottom navigation.
const navItems = [
  { name: 'overview', icon: 'mdi-view-dashboard-outline', label: 'nav.overview' },
  { name: 'dashboard', icon: 'mdi-devices', label: 'nav.devices' },
  { name: 'alerts', icon: 'mdi-bell-outline', label: 'nav.alerts' },
  { name: 'settings', icon: 'mdi-cog-outline', label: 'nav.settings' },
] as const

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
      <template #prepend>
        <v-icon icon="mdi-chart-line-variant" color="primary" class="ms-2" />
      </template>

      <!-- Title text is hidden on phones so it never collides with the actions. -->
      <v-app-bar-title v-if="!xs" class="font-weight-bold">
        {{ t('app.title') }}
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
        <!-- Icon-only sign-out on small screens to save width. -->
        <v-btn
          v-if="smAndDown"
          icon="mdi-logout"
          :aria-label="t('actions.signOut')"
          variant="text"
          @click="onSignOut"
        />
        <v-btn v-else variant="text" prepend-icon="mdi-logout" @click="onSignOut">
          {{ t('actions.signOut') }}
        </v-btn>
      </template>

      <!-- Desktop / tablet: tabs in the app-bar extension. -->
      <template v-if="!smAndDown" #extension>
        <v-tabs density="comfortable">
          <v-tab
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            :prepend-icon="item.icon"
          >
            {{ t(item.label) }}
          </v-tab>
        </v-tabs>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <!-- Mobile: native-feeling bottom navigation instead of top tabs. -->
    <v-bottom-navigation v-if="showBar && smAndDown" color="primary" grow>
      <v-btn v-for="item in navItems" :key="item.name" :to="{ name: item.name }">
        <v-icon :icon="item.icon" />
        <span>{{ t(item.label) }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
