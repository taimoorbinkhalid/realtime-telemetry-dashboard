<script setup lang="ts">
import AnimatedNumber from './AnimatedNumber.vue'

withDefaults(
  defineProps<{
    label: string
    value: number
    /** Formats the numeric value for display. */
    formatter?: (n: number) => string
    icon?: string
    /** Vuetify color token for the icon/accent. */
    color?: string
  }>(),
  {
    formatter: (n: number) => String(Math.round(n)),
    icon: 'mdi-chart-box-outline',
    color: 'primary',
  },
)
</script>

<template>
  <v-card class="h-100">
    <v-card-text class="d-flex align-center ga-4">
      <v-avatar :color="color" variant="tonal" size="48">
        <v-icon :icon="icon" />
      </v-avatar>
      <div>
        <div class="text-caption text-medium-emphasis">{{ label }}</div>
        <div class="text-h5 font-weight-bold">
          <AnimatedNumber :value="value" :formatter="formatter" />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
