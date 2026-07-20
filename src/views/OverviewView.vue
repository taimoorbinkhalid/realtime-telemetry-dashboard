<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import type { FleetStats } from '@/types'
import { getFleetStats } from '@/services/analyticsService'
import { formatHumidity, formatTemperature } from '@/utils/format'
import { useAlertsStore } from '@/stores/alerts'
import KpiTile from '@/components/KpiTile.vue'
import StatusDonut from '@/components/StatusDonut.vue'

const { t } = useI18n()
const alertsStore = useAlertsStore()
const { activeCount } = storeToRefs(alertsStore)

const stats = ref<FleetStats | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Aggregation queries are one-shot; refresh on mount and on a light interval so
// the KPIs stay current as the fleet streams (numbers animate between values).
const REFRESH_MS = 30_000
let timer: ReturnType<typeof setInterval> | undefined

async function loadStats(): Promise<void> {
  try {
    stats.value = await getFleetStats()
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
  timer = setInterval(loadStats, REFRESH_MS)
})
onUnmounted(() => clearInterval(timer))

const s = computed(() => stats.value)
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold">{{ t('overview.heading') }}</h2>
        <p class="text-medium-emphasis mb-0">{{ t('overview.subtitle') }}</p>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="loading"
        :aria-label="t('actions.retry')"
        @click="loadStats"
      />
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-row v-if="loading && !s">
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="3">
        <v-skeleton-loader type="list-item-avatar" />
      </v-col>
    </v-row>

    <template v-else-if="s">
      <v-row>
        <v-col cols="6" md="3">
          <KpiTile :label="t('overview.totalDevices')" :value="s.total" icon="mdi-devices" color="primary" />
        </v-col>
        <v-col cols="6" md="3">
          <KpiTile :label="t('status.online')" :value="s.online" icon="mdi-check-circle" color="success" />
        </v-col>
        <v-col cols="6" md="3">
          <KpiTile :label="t('status.warning')" :value="s.warning" icon="mdi-alert" color="warning" />
        </v-col>
        <v-col cols="6" md="3">
          <KpiTile :label="t('status.offline')" :value="s.offline" icon="mdi-close-circle" color="error" />
        </v-col>
      </v-row>

      <v-row class="mt-1">
        <v-col cols="6" md="3">
          <KpiTile
            :label="t('overview.avgTemperature')"
            :value="s.avgTemperature"
            :formatter="formatTemperature"
            icon="mdi-thermometer"
            color="accent"
          />
        </v-col>
        <v-col cols="6" md="3">
          <KpiTile
            :label="t('overview.avgHumidity')"
            :value="s.avgHumidity"
            :formatter="formatHumidity"
            icon="mdi-water-percent"
            color="info"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-card
            :to="{ name: 'alerts' }"
            hover
            class="h-100"
          >
            <v-card-text class="d-flex align-center ga-4">
              <v-avatar :color="activeCount > 0 ? 'error' : 'success'" variant="tonal" size="48">
                <v-icon :icon="activeCount > 0 ? 'mdi-bell-ring' : 'mdi-bell-check'" />
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis">{{ t('overview.activeAlerts') }}</div>
                <div class="text-h5 font-weight-bold">{{ activeCount }}</div>
              </div>
              <v-spacer />
              <v-icon icon="mdi-chevron-right" class="text-medium-emphasis" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-1">
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="text-body-1">{{ t('overview.statusDistribution') }}</v-card-title>
            <v-card-text>
              <StatusDonut :online="s.online" :warning="s.warning" :offline="s.offline" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>
