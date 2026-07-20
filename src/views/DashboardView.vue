<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useDevicesStore } from '@/stores/devices'
import { useUserStore } from '@/stores/user'
import { useDeviceFilters, type SortKey } from '@/composables/useDeviceFilters'
import { toCsv, downloadCsv } from '@/utils/csv'
import type { DeviceStatus } from '@/types'
import DeviceCard from '@/components/DeviceCard.vue'

const { t } = useI18n()
const store = useDevicesStore()
const userStore = useUserStore()
const { devices, loading, error } = storeToRefs(store)

const { search, statusFilter, favoritesOnly, sortKey, sortDir, filtered, isFiltered, clear } =
  useDeviceFilters(devices, (id) => userStore.isFavorite(id))

onMounted(() => {
  store.subscribe()
  // Honor the user's saved "favorites only" preference as the initial state.
  favoritesOnly.value = userStore.preferences.favoritesOnly
})
// Keep in sync if preferences load after mount.
watch(
  () => userStore.preferences.favoritesOnly,
  (v) => (favoritesOnly.value = v),
)

const statusItems: Array<{ value: DeviceStatus | 'all'; title: string }> = [
  { value: 'all', title: t('filters.allStatuses') },
  { value: 'online', title: t('status.online') },
  { value: 'warning', title: t('status.warning') },
  { value: 'offline', title: t('status.offline') },
]

const sortItems: Array<{ value: SortKey; title: string }> = [
  { value: 'name', title: t('filters.sortName') },
  { value: 'temperature', title: t('filters.sortTemperature') },
  { value: 'status', title: t('filters.sortStatus') },
  { value: 'lastReading', title: t('filters.sortLastReading') },
]

const hasDevices = computed(() => devices.value.length > 0)

function onExport(): void {
  downloadCsv('devices.csv', toCsv(filtered.value))
}

function toggleSortDir(): void {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div>
        <h2 class="text-h5 font-weight-bold">{{ t('dashboard.heading') }}</h2>
        <p v-if="hasDevices" class="text-medium-emphasis mb-0">
          {{ t('dashboard.deviceCount', filtered.length) }}
        </p>
      </div>
      <v-btn
        variant="tonal"
        prepend-icon="mdi-download"
        :disabled="!filtered.length"
        @click="onExport"
      >
        {{ t('actions.exportCsv') }}
      </v-btn>
    </div>

    <!-- Filter / sort toolbar -->
    <v-card v-if="hasDevices" class="mb-4" variant="tonal">
      <v-card-text class="d-flex flex-wrap align-center ga-3">
        <v-text-field
          v-model="search"
          :label="t('filters.search')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 220px; max-width: 320px"
        />
        <v-select
          v-model="statusFilter"
          :items="statusItems"
          :label="t('status.online')"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 160px"
        />
        <v-select
          v-model="sortKey"
          :items="sortItems"
          :label="t('filters.sortBy')"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 180px"
        />
        <v-btn
          :icon="sortDir === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
          variant="text"
          density="comfortable"
          :aria-label="t('filters.sortBy')"
          @click="toggleSortDir"
        />
        <v-switch
          v-model="favoritesOnly"
          :label="t('filters.favoritesOnly')"
          color="primary"
          hide-details
          density="compact"
        />
        <v-spacer />
        <v-btn v-if="isFiltered" variant="text" size="small" @click="clear">
          {{ t('actions.clearFilters') }}
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Error state -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ t('dashboard.loadError') }}
      <template #append>
        <v-btn variant="text" @click="store.reset(); store.subscribe()">
          {{ t('actions.retry') }}
        </v-btn>
      </template>
    </v-alert>

    <!-- Loading skeletons -->
    <v-row v-if="loading && !hasDevices">
      <v-col v-for="n in 6" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <!-- Empty (no devices at all) -->
    <v-sheet
      v-else-if="!hasDevices && !error"
      class="d-flex flex-column align-center justify-center text-center pa-12"
      rounded="lg"
      border
    >
      <v-icon icon="mdi-radar" size="64" color="medium-emphasis" class="mb-4" />
      <p class="text-h6">{{ t('dashboard.empty') }}</p>
      <p class="text-medium-emphasis">{{ t('dashboard.emptyHint') }}</p>
    </v-sheet>

    <!-- No matches for current filters -->
    <v-sheet
      v-else-if="!filtered.length"
      class="d-flex flex-column align-center justify-center text-center pa-12"
      rounded="lg"
      border
    >
      <v-icon icon="mdi-filter-remove-outline" size="64" color="medium-emphasis" class="mb-4" />
      <p class="text-h6">{{ t('filters.none') }}</p>
      <v-btn variant="tonal" @click="clear">{{ t('actions.clearFilters') }}</v-btn>
    </v-sheet>

    <!-- Device grid -->
    <v-row v-else>
      <v-col v-for="device in filtered" :key="device.id" cols="12" sm="6" md="4" lg="3">
        <DeviceCard :device="device" />
      </v-col>
    </v-row>
  </v-container>
</template>
