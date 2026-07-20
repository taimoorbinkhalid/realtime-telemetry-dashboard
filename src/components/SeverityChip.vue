<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AlertSeverity } from '@/types'

const props = defineProps<{ severity: AlertSeverity }>()
const { t } = useI18n()

// Map severity → Vuetify semantic color token (defined in the theme).
const color = computed(() => (props.severity === 'critical' ? 'error' : 'warning'))
const icon = computed(() => (props.severity === 'critical' ? 'mdi-alert-octagon' : 'mdi-alert'))
const label = computed(() => t(`severity.${props.severity}`))
</script>

<template>
  <v-chip :color="color" size="small" variant="flat" label>
    <v-icon start :icon="icon" size="14" />
    {{ label }}
  </v-chip>
</template>
