/**
 * Small, locale-aware formatting helpers shared across components.
 */

/** Format a temperature in Celsius, e.g. `21.4°C`. */
export function formatTemperature(celsius: number): string {
  return `${celsius.toFixed(1)}°C`
}

/** Format a relative humidity percentage, e.g. `48%`. */
export function formatHumidity(percent: number): string {
  return `${Math.round(percent)}%`
}

/**
 * Format an epoch-millis timestamp as a short relative string ("just now",
 * "3 min ago", "2 h ago"), falling back to a localized time for older values.
 */
export function formatRelativeTime(epochMillis: number, now: number = Date.now()): string {
  if (!epochMillis) return '—'
  const diffSec = Math.max(0, Math.round((now - epochMillis) / 1000))
  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} h ago`
  return new Date(epochMillis).toLocaleString()
}
