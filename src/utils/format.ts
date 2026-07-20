/**
 * Small, locale-aware formatting helpers shared across components. Number and
 * relative-time formatting go through the `Intl` APIs so they respect the
 * active locale (decimal separators, "vor 3 Minuten", etc.). `locale` defaults
 * to English so the pure functions stay easy to test.
 */

/** Format a temperature in Celsius, e.g. `21.4°C` (en) / `21,4 °C` (de). */
export function formatTemperature(celsius: number, locale = 'en'): string {
  const n = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(celsius)
  return `${n}°C`
}

/** Format a relative humidity percentage, e.g. `48%`. */
export function formatHumidity(percent: number, locale = 'en'): string {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(percent))
  return `${n}%`
}

/**
 * Format an epoch-millis timestamp as a localized relative string
 * ("now", "3 minutes ago", "vor 3 Stunden"), falling back to a localized
 * absolute date/time for values older than ~30 days.
 */
export function formatRelativeTime(epochMillis: number, locale = 'en', now: number = Date.now()): string {
  if (!epochMillis) return '—'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const sec = Math.max(0, Math.round((now - epochMillis) / 1000))
  if (sec < 60) return rtf.format(-sec, 'second')
  const min = Math.round(sec / 60)
  if (min < 60) return rtf.format(-min, 'minute')
  const hr = Math.round(min / 60)
  if (hr < 24) return rtf.format(-hr, 'hour')
  const day = Math.round(hr / 24)
  if (day < 30) return rtf.format(-day, 'day')
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(epochMillis))
}
