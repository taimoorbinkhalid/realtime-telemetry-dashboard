<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAlertsStore } from '@/stores/alerts'
import { useUserStore } from '@/stores/user'
import { formatRelativeTime } from '@/utils/format'
import SeverityChip from '@/components/SeverityChip.vue'

const { t, locale } = useI18n()
const store = useAlertsStore()
const userStore = useUserStore()
const { active, resolved, error } = storeToRefs(store)

function onAcknowledge(alertId: string): void {
  userStore.acknowledge(alertId)
}
</script>

<template>
  <v-container>
    <h2 class="text-h5 font-weight-bold mb-4">{{ t('alerts.heading') }}</h2>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <!-- Active alerts -->
    <v-card class="mb-6">
      <v-card-title class="text-body-1 d-flex align-center ga-2">
        <v-icon icon="mdi-bell-ring" color="error" />
        {{ t('alerts.active') }}
        <v-chip size="small" variant="tonal">{{ active.length }}</v-chip>
      </v-card-title>
      <v-divider />

      <div v-if="active.length === 0" class="d-flex flex-column align-center text-center pa-8">
        <v-icon icon="mdi-shield-check" size="48" color="success" class="mb-2" />
        <p class="text-medium-emphasis mb-0">{{ t('alerts.noneActive') }}</p>
      </div>

      <v-list v-else lines="two">
        <template v-for="(alert, i) in active" :key="alert.id">
          <v-list-item :to="{ name: 'device', params: { id: alert.deviceId } }">
            <template #prepend>
              <SeverityChip :severity="alert.severity" class="me-3" />
            </template>
            <v-list-item-title>{{ alert.deviceName }}</v-list-item-title>
            <v-list-item-subtitle>{{ alert.message }}</v-list-item-subtitle>
            <template #append>
              <div class="d-flex align-center ga-3">
                <span class="text-caption text-medium-emphasis">
                  {{ formatRelativeTime(alert.createdAt, locale) }}
                </span>
                <v-chip
                  v-if="userStore.isAcknowledged(alert.id)"
                  size="small"
                  variant="tonal"
                  color="success"
                  prepend-icon="mdi-check"
                >
                  {{ t('actions.acknowledged') }}
                </v-chip>
                <v-btn
                  v-else
                  size="small"
                  variant="tonal"
                  @click.prevent.stop="onAcknowledge(alert.id)"
                >
                  {{ t('actions.acknowledge') }}
                </v-btn>
              </div>
            </template>
          </v-list-item>
          <v-divider v-if="i < active.length - 1" inset />
        </template>
      </v-list>
    </v-card>

    <!-- Recent resolved -->
    <v-card v-if="resolved.length">
      <v-card-title class="text-body-1 d-flex align-center ga-2">
        <v-icon icon="mdi-history" class="text-medium-emphasis" />
        {{ t('alerts.recentlyResolved') }}
      </v-card-title>
      <v-divider />
      <v-list lines="two">
        <template v-for="(alert, i) in resolved" :key="alert.id">
          <v-list-item :to="{ name: 'device', params: { id: alert.deviceId } }">
            <template #prepend>
              <v-icon icon="mdi-check-circle-outline" color="success" class="me-3" />
            </template>
            <v-list-item-title>{{ alert.deviceName }}</v-list-item-title>
            <v-list-item-subtitle>{{ alert.message }}</v-list-item-subtitle>
            <template #append>
              <span class="text-caption text-medium-emphasis">
                {{ alert.resolvedAt ? formatRelativeTime(alert.resolvedAt, locale) : '' }}
              </span>
            </template>
          </v-list-item>
          <v-divider v-if="i < resolved.length - 1" inset />
        </template>
      </v-list>
    </v-card>
  </v-container>
</template>
