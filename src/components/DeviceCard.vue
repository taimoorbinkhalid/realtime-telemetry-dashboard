<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Device } from '@/types'
import { formatHumidity, formatRelativeTime, formatTemperature } from '@/utils/format'
import StatusChip from './StatusChip.vue'

const props = defineProps<{ device: Device }>()
const { t } = useI18n()

const temperature = computed(() => formatTemperature(props.device.temperature))
const humidity = computed(() => formatHumidity(props.device.humidity))
const lastSeen = computed(() =>
  t('device.lastSeen', { time: formatRelativeTime(props.device.lastReadingAt) }),
)
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
        <StatusChip :status="device.status" />
      </div>
    </v-card-item>

    <v-card-text class="flex-grow-1">
      <div class="d-flex justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-thermometer" color="accent" />
          <div>
            <div class="text-caption text-medium-emphasis">{{ t('device.temperature') }}</div>
            <div class="text-h6">{{ temperature }}</div>
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-water-percent" color="info" />
          <div>
            <div class="text-caption text-medium-emphasis">{{ t('device.humidity') }}</div>
            <div class="text-h6">{{ humidity }}</div>
          </div>
        </div>
      </div>
    </v-card-text>

    <v-divider />
    <v-card-actions class="text-caption text-medium-emphasis px-4">
      <v-icon icon="mdi-clock-outline" size="14" class="me-1" />
      {{ lastSeen }}
    </v-card-actions>
  </v-card>
</template>
