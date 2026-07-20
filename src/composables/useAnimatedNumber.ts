/**
 * Tween a reactive number toward its latest value so live updates count up/down
 * smoothly instead of snapping. Snaps on first value (no count-up from zero on
 * mount) and respects the user's reduced-motion preference.
 */
import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

/** Ease-out cubic: fast start, gentle settle. Exported for testing. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

interface Options {
  /** Tween duration in milliseconds. */
  duration?: number
}

export function useAnimatedNumber(source: MaybeRefOrGetter<number>, options: Options = {}): Ref<number> {
  const duration = options.duration ?? 600
  const displayed = ref(0)

  let firstSeen = false
  let raf = 0
  let fromValue = 0
  let toTarget = 0
  let startTime = 0

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function frame(ts: number): void {
    if (!startTime) startTime = ts
    const progress = Math.min(1, (ts - startTime) / duration)
    displayed.value = fromValue + (toTarget - fromValue) * easeOutCubic(progress)
    if (progress < 1) raf = requestAnimationFrame(frame)
  }

  watch(
    () => toValue(source),
    (next) => {
      const target = typeof next === 'number' && Number.isFinite(next) ? next : 0
      // Snap on first value and when the user prefers reduced motion.
      if (!firstSeen || prefersReduced) {
        firstSeen = true
        cancelAnimationFrame(raf)
        displayed.value = target
        return
      }
      cancelAnimationFrame(raf)
      fromValue = displayed.value
      toTarget = target
      startTime = 0
      raf = requestAnimationFrame(frame)
    },
    { immediate: true },
  )

  onUnmounted(() => cancelAnimationFrame(raf))

  return displayed
}
