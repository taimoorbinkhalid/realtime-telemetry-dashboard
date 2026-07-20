<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useAppTheme } from '@/composables/useAppTheme'
import type { TimeRange } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()
const auth = useAuthStore()
const { preferences, favorites, error } = storeToRefs(userStore)
const { isDark, toggle } = useAppTheme()

const timeRangeOptions: TimeRange[] = ['1h', '6h', '24h']

const defaultTimeRange = computed({
  get: () => preferences.value.defaultTimeRange,
  set: (value: TimeRange) => userStore.updatePreferences({ defaultTimeRange: value }),
})

const favoritesOnly = computed({
  get: () => preferences.value.favoritesOnly,
  set: (value: boolean) => userStore.updatePreferences({ favoritesOnly: value }),
})
</script>

<template>
  <v-container>
    <h2 class="text-h5 font-weight-bold mb-4">{{ t('settings.heading') }}</h2>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-card class="mb-4">
      <v-card-title class="text-body-1">{{ t('settings.account') }}</v-card-title>
      <v-card-text>
        <div class="d-flex align-center ga-3">
          <v-icon icon="mdi-account-circle" size="40" class="text-medium-emphasis" />
          <div>
            <div>{{ auth.user?.email }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t('settings.favoritesCount', favorites.length) }}
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title class="text-body-1">{{ t('settings.preferences') }}</v-card-title>
      <v-card-text>
        <v-select
          v-model="defaultTimeRange"
          :items="timeRangeOptions"
          :label="t('settings.defaultTimeRange')"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-switch
          v-model="favoritesOnly"
          :label="t('settings.favoritesOnly')"
          color="primary"
          hide-details
          class="mb-2"
        />
        <v-switch
          :model-value="isDark"
          :label="t('settings.darkMode')"
          color="primary"
          hide-details
          @update:model-value="toggle"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>
