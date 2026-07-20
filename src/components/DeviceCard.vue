<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Device } from '@/types'
import { formatHumidity, formatRelativeTime, formatTemperature } from '@/utils/format'
import { useAlertsStore } from '@/stores/alerts'
import { useUserStore } from '@/stores/user'
import StatusChip from './StatusChip.vue'
import AnimatedNumber from './AnimatedNumber.vue'

const props = defineProps<{ device: Device }>()
const { t, locale } = useI18n()
const alertsStore = useAlertsStore()
const userStore = useUserStore()

const tempFmt = (n: number) => formatTemperature(n, locale.value)
const humFmt = (n: number) => formatHumidity(n, locale.value)
const lastSeen = computed(() =>
  t('device.lastSeen', { time: formatRelativeTime(props.device.lastReadingAt, locale.value) }),
)
const activeAlerts = computed(() => alertsStore.activeForDevice(props.device.id))
const isFavorite = computed(() => userStore.isFavorite(props.device.id))

function onToggleFavorite(): void {
  userStore.toggleFavorite(props.device.id)
}
</script>

<template>
  <v-card
    :to="{ name: 'device', params: { id: device.id } }"
    hover
    class="h-100 d-flex flex-column"
  >
    <v-card-item>
      <div class="d-flex justify-space-between align-start ga-2">
        <div>
          <v-card-title class="text-body-1 font-weight-bold pa-0">
            {{ device.name }}
          </v-card-title>
          <v-card-subtitle class="pa-0">
            <v-icon icon="mdi-map-marker-outline" size="14" />
            {{ device.location }}
          </v-card-subtitle>
        </div>
        <div class="d-flex align-center ga-1">
          <v-btn
            :icon="isFavorite ? 'mdi-star' : 'mdi-star-outline'"
            :color="isFavorite ? 'amber' : undefined"
            :aria-label="isFavorite ? t('favorites.remove') : t('favorites.add')"
            variant="text"
            density="comfortable"
            size="small"
            @click.prevent.stop="onToggleFavorite"
          />
          <StatusChip :status="device.status" />
        </div>
      </div>
    </v-card-item>

    <v-card-text class="flex-grow-1">
      <div class="d-flex justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-thermometer" color="accent" />
          <div>
            <div class="text-caption text-medium-emphasis">{{ t('device.temperature') }}</div>
            <div class="text-h6">
              <AnimatedNumber :value="device.temperature" :formatter="tempFmt" />
            </div>
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-water-percent" color="info" />
          <div>
            <div class="text-caption text-medium-emphasis">{{ t('device.humidity') }}</div>
            <div class="text-h6">
              <AnimatedNumber :value="device.humidity" :formatter="humFmt" />
            </div>
          </div>
        </div>
      </div>

      <v-chip
        v-if="activeAlerts.length"
        color="error"
        size="small"
        variant="tonal"
        class="mt-3"
        prepend-icon="mdi-alert"
      >
        {{ t('alerts.indicator', activeAlerts.length) }}
      </v-chip>
    </v-card-text>

    <v-divider />
    <v-card-actions class="text-caption text-medium-emphasis px-4">
      <v-icon icon="mdi-clock-outline" size="14" class="me-1" />
      {{ lastSeen }}
    </v-card-actions>
  </v-card>
</template>
