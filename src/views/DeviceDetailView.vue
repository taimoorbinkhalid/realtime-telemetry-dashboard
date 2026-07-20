<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Device, Reading } from '@/types'
import { subscribeToDevice, subscribeToReadings } from '@/services/deviceService'
import { formatHumidity, formatRelativeTime, formatTemperature } from '@/utils/format'
import StatusChip from '@/components/StatusChip.vue'
import TelemetryChart from '@/components/TelemetryChart.vue'

const props = defineProps<{ id: string }>()
const { t } = useI18n()

const device = ref<Device | null>(null)
const readings = ref<Reading[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const MAX_READINGS = 60
let unsubDevice: (() => void) | null = null
let unsubReadings: (() => void) | null = null

onMounted(() => {
  unsubDevice = subscribeToDevice(
    props.id,
    (d) => {
      device.value = d
      loading.value = false
    },
    (e) => {
      error.value = e.message
      loading.value = false
    },
  )
  unsubReadings = subscribeToReadings(
    props.id,
    MAX_READINGS,
    (r) => (readings.value = r),
    (e) => (error.value = e.message),
  )
})

onUnmounted(() => {
  unsubDevice?.()
  unsubReadings?.()
})
</script>

<template>
  <v-container>
    <v-btn
      variant="text"
      prepend-icon="mdi-arrow-left"
      :to="{ name: 'dashboard' }"
      class="mb-4"
    >
      {{ t('actions.back') }}
    </v-btn>

    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-alert v-else-if="!device" type="warning" variant="tonal">
      {{ t('device.notFound') }}
    </v-alert>

    <template v-else>
      <div class="d-flex flex-wrap align-center ga-3 mb-2">
        <h2 class="text-h5 font-weight-bold">{{ device.name }}</h2>
        <StatusChip :status="device.status" />
      </div>
      <p class="text-medium-emphasis">
        <v-icon icon="mdi-map-marker-outline" size="16" /> {{ device.location }}
        &middot; {{ t('device.lastSeen', { time: formatRelativeTime(device.lastReadingAt) }) }}
      </p>

      <v-row class="my-2">
        <v-col cols="6" sm="4">
          <v-card variant="tonal" color="accent">
            <v-card-text class="d-flex align-center ga-3">
              <v-icon icon="mdi-thermometer" size="32" />
              <div>
                <div class="text-caption">{{ t('device.temperature') }}</div>
                <div class="text-h5">{{ formatTemperature(device.temperature) }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="4">
          <v-card variant="tonal" color="info">
            <v-card-text class="d-flex align-center ga-3">
              <v-icon icon="mdi-water-percent" size="32" />
              <div>
                <div class="text-caption">{{ t('device.humidity') }}</div>
                <div class="text-h5">{{ formatHumidity(device.humidity) }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="mt-4">
        <v-card-title class="text-body-1">{{ t('device.history') }}</v-card-title>
        <v-card-text>
          <TelemetryChart v-if="readings.length" :readings="readings" />
          <p v-else class="text-medium-emphasis text-center py-8">
            {{ t('device.noReadings') }}
          </p>
        </v-card-text>
      </v-card>
    </template>
  </v-container>
</template>
