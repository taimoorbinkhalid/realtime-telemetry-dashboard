<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Device, Reading, TimeRange } from '@/types'
import { subscribeToDevice, subscribeToReadingsInRange } from '@/services/deviceService'
import { formatHumidity, formatRelativeTime, formatTemperature } from '@/utils/format'
import { useUserStore } from '@/stores/user'
import { useAlertsStore } from '@/stores/alerts'
import StatusChip from '@/components/StatusChip.vue'
import SeverityChip from '@/components/SeverityChip.vue'
import TelemetryChart from '@/components/TelemetryChart.vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()
const userStore = useUserStore()
const alertsStore = useAlertsStore()

const tempFmt = (n: number) => formatTemperature(n, locale.value)
const humFmt = (n: number) => formatHumidity(n, locale.value)

const device = ref<Device | null>(null)
const readings = ref<Reading[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const range = ref<TimeRange>(userStore.preferences.defaultTimeRange)

const MAX_READINGS = 500
const RANGE_MS: Record<TimeRange, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}
const RANGES: TimeRange[] = ['1h', '6h', '24h']

let unsubDevice: (() => void) | null = null
let unsubReadings: (() => void) | null = null

/** (Re)subscribe readings for the current time range. */
function subscribeReadings(): void {
  unsubReadings?.()
  const since = Date.now() - RANGE_MS[range.value]
  unsubReadings = subscribeToReadingsInRange(
    props.id,
    since,
    MAX_READINGS,
    (r) => (readings.value = r),
    (e) => (error.value = e.message),
  )
}

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
  subscribeReadings()
})

watch(range, subscribeReadings)

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
        &middot; {{ t('device.lastSeen', { time: formatRelativeTime(device.lastReadingAt, locale) }) }}
      </p>

      <!-- Active alerts for this device -->
      <v-alert
        v-for="alert in alertsStore.activeForDevice(device.id)"
        :key="alert.id"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        <div class="d-flex align-center ga-3">
          <SeverityChip :severity="alert.severity" />
          <span>{{ alert.message }}</span>
        </div>
      </v-alert>

      <v-row class="my-2">
        <v-col cols="6" sm="4">
          <v-card variant="tonal" color="accent">
            <v-card-text class="d-flex align-center ga-3">
              <v-icon icon="mdi-thermometer" size="32" />
              <div>
                <div class="text-caption">{{ t('device.temperature') }}</div>
                <div class="text-h5">
                  <AnimatedNumber :value="device.temperature" :formatter="tempFmt" />
                </div>
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
                <div class="text-h5">
                  <AnimatedNumber :value="device.humidity" :formatter="humFmt" />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="mt-4">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <span class="text-body-1">{{ t('device.history') }}</span>
          <v-btn-toggle v-model="range" mandatory density="comfortable" variant="outlined" divided>
            <v-btn v-for="r in RANGES" :key="r" :value="r" size="small">
              {{ t(`timeRange.${r}`) }}
            </v-btn>
          </v-btn-toggle>
        </v-card-title>
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
