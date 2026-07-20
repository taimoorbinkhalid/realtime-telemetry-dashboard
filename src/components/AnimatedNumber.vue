<script setup lang="ts">
import { computed } from 'vue'
import { useAnimatedNumber } from '@/composables/useAnimatedNumber'

const props = withDefaults(
  defineProps<{
    /** Target value; the display tweens toward it on change. */
    value: number
    /** Formats the (tweened) number into the displayed string. */
    formatter?: (n: number) => string
    /** Tween duration in ms. */
    duration?: number
  }>(),
  {
    formatter: (n: number) => String(Math.round(n)),
    duration: 600,
  },
)

const animated = useAnimatedNumber(() => props.value, { duration: props.duration })
const display = computed(() => props.formatter(animated.value))
</script>

<template>
  <span>{{ display }}</span>
</template>
