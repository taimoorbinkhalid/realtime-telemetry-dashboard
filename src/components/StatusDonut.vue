<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { statusColors } from '@/plugins/theme'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ online: number; warning: number; offline: number }>()
const { t } = useI18n()
const theme = useTheme()

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: [t('status.online'), t('status.warning'), t('status.offline')],
  datasets: [
    {
      data: [props.online, props.warning, props.offline],
      backgroundColor: [statusColors.online, statusColors.warning, statusColors.offline],
      borderWidth: 0,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'doughnut'>>(() => {
  const tick = theme.current.value.dark ? '#B0BEC5' : '#546E7A'
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { color: tick, padding: 16 } },
    },
  }
})

const isEmpty = computed(() => props.online + props.warning + props.offline === 0)
</script>

<template>
  <div class="donut-wrap">
    <Doughnut v-if="!isEmpty" :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.donut-wrap {
  position: relative;
  height: 260px;
  width: 100%;
}
</style>
