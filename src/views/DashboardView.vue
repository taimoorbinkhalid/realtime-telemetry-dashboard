<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useDevicesStore } from '@/stores/devices'
import DeviceCard from '@/components/DeviceCard.vue'

const { t } = useI18n()
const store = useDevicesStore()
const { devices, loading, error } = storeToRefs(store)

onMounted(() => store.subscribe())

const hasDevices = computed(() => devices.value.length > 0)
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold">{{ t('dashboard.heading') }}</h2>
        <p v-if="hasDevices" class="text-medium-emphasis mb-0">
          {{ t('dashboard.deviceCount', devices.length) }}
        </p>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="loading"
        :aria-label="t('actions.retry')"
        @click="store.reset(); store.subscribe()"
      />
    </div>

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

    <!-- Empty state -->
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

    <!-- Device grid -->
    <v-row v-else>
      <v-col
        v-for="device in devices"
        :key="device.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <DeviceCard :device="device" />
      </v-col>
    </v-row>
  </v-container>
</template>
