<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DeviceStatus } from '@/types'

const props = defineProps<{ status: DeviceStatus }>()
const { t } = useI18n()

// Map status → Vuetify semantic color token (defined in the theme).
const color = computed(() => {
  switch (props.status) {
    case 'online':
      return 'success'
    case 'warning':
      return 'warning'
    default:
      return 'error'
  }
})

const label = computed(() => t(`status.${props.status}`))
</script>

<template>
  <v-chip :color="color" size="small" variant="flat" label>
    <v-icon start icon="mdi-circle" size="10" />
    {{ label }}
  </v-chip>
</template>
