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

      <template v-else>
        <template v-for="(alert, i) in active" :key="alert.id">
          <div class="alert-row pa-4">
            <div class="d-flex align-center ga-2 mb-1">
              <SeverityChip :severity="alert.severity" />
              <router-link
                :to="{ name: 'device', params: { id: alert.deviceId } }"
                class="alert-device text-truncate font-weight-medium"
              >
                {{ alert.deviceName }}
              </router-link>
              <v-spacer />
              <span class="text-caption text-medium-emphasis flex-shrink-0">
                {{ formatRelativeTime(alert.createdAt, locale) }}
              </span>
            </div>
            <div class="text-body-2 text-medium-emphasis">{{ alert.message }}</div>
            <div class="d-flex justify-end mt-2">
              <v-chip
                v-if="userStore.isAcknowledged(alert.id)"
                size="small"
                variant="tonal"
                color="success"
                prepend-icon="mdi-check"
              >
                {{ t('actions.acknowledged') }}
              </v-chip>
              <v-btn v-else size="small" variant="tonal" @click="onAcknowledge(alert.id)">
                {{ t('actions.acknowledge') }}
              </v-btn>
            </div>
          </div>
          <v-divider v-if="i < active.length - 1" />
        </template>
      </template>
    </v-card>

    <!-- Recent resolved -->
    <v-card v-if="resolved.length">
      <v-card-title class="text-body-1 d-flex align-center ga-2">
        <v-icon icon="mdi-history" class="text-medium-emphasis" />
        {{ t('alerts.recentlyResolved') }}
      </v-card-title>
      <v-divider />
      <template v-for="(alert, i) in resolved" :key="alert.id">
        <div class="alert-row pa-4">
          <div class="d-flex align-center ga-2 mb-1">
            <v-icon icon="mdi-check-circle-outline" color="success" size="20" />
            <router-link
              :to="{ name: 'device', params: { id: alert.deviceId } }"
              class="alert-device text-truncate font-weight-medium"
            >
              {{ alert.deviceName }}
            </router-link>
            <v-spacer />
            <span class="text-caption text-medium-emphasis flex-shrink-0">
              {{ alert.resolvedAt ? formatRelativeTime(alert.resolvedAt, locale) : '' }}
            </span>
          </div>
          <div class="text-body-2 text-medium-emphasis alert-message-clamp">{{ alert.message }}</div>
        </div>
        <v-divider v-if="i < resolved.length - 1" />
      </template>
    </v-card>
  </v-container>
</template>

<style scoped>
.alert-device {
  color: inherit;
  text-decoration: none;
  min-width: 0;
}
.alert-device:hover {
  text-decoration: underline;
}
/* Keep the resolved history compact: at most two lines per message. */
.alert-message-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
