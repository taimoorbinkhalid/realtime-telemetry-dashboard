<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAlertsStore } from '@/stores/alerts'

const { t } = useI18n()
const store = useAlertsStore()
const { activeCount } = storeToRefs(store)
</script>

<template>
  <v-btn
    :to="{ name: 'alerts' }"
    variant="text"
    icon
    :aria-label="t('nav.alerts')"
  >
    <v-badge
      :content="activeCount"
      :model-value="activeCount > 0"
      color="error"
      max="99"
    >
      <v-icon icon="mdi-bell-outline" />
    </v-badge>
  </v-btn>
</template>
