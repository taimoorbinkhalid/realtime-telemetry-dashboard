<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { Reading } from '@/types'

// Register only the Chart.js pieces this line chart needs (tree-shakeable).
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps<{ readings: Reading[] }>()
const { t } = useI18n()
const theme = useTheme()

// Readings arrive newest-first; the chart wants oldest-first (left→right).
const ordered = computed(() => [...props.readings].reverse())

const labels = computed(() =>
  ordered.value.map((r) =>
    new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  ),
)

const chartData = computed<ChartData<'line'>>(() => {
  // Vuetify 4 types theme colors as a union (string | color object), so coerce
  // to the hex strings Chart.js expects.
  const colors = theme.current.value.colors
  const accent = String(colors.accent)
  const info = String(colors.info)
  return {
    labels: labels.value,
    datasets: [
      {
        label: `${t('device.temperature')} (${t('units.celsius')})`,
        data: ordered.value.map((r) => r.temperature),
        borderColor: accent,
        backgroundColor: accent + '33',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        yAxisID: 'yTemp',
      },
      {
        label: `${t('device.humidity')} (${t('units.percent')})`,
        data: ordered.value.map((r) => r.humidity),
        borderColor: info,
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 0,
        yAxisID: 'yHum',
      },
    ],
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const grid = theme.current.value.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tick = theme.current.value.dark ? '#B0BEC5' : '#546E7A'
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: tick } },
    },
    scales: {
      x: { grid: { color: grid }, ticks: { color: tick, maxTicksLimit: 8 } },
      yTemp: {
        type: 'linear',
        position: 'left',
        grid: { color: grid },
        ticks: { color: tick },
      },
      yHum: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { color: tick },
      },
    },
  }
})
</script>

<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  height: 320px;
  width: 100%;
}
</style>
