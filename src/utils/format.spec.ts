import { describe, it, expect } from 'vitest'
import { formatTemperature, formatHumidity, formatRelativeTime } from './format'

describe('formatTemperature', () => {
  it('formats to one decimal with a degree suffix (en)', () => {
    expect(formatTemperature(21.4)).toBe('21.4°C')
    expect(formatTemperature(4)).toBe('4.0°C')
    expect(formatTemperature(-18.25)).toBe('-18.3°C')
  })
  it('respects the locale decimal separator', () => {
    expect(formatTemperature(21.4, 'de')).toBe('21,4°C')
  })
})

describe('formatHumidity', () => {
  it('rounds to a whole percentage', () => {
    expect(formatHumidity(48)).toBe('48%')
    expect(formatHumidity(47.6)).toBe('48%')
  })
})

describe('formatRelativeTime', () => {
  const now = 1_700_000_000_000

  it('returns an em dash for a falsy timestamp', () => {
    expect(formatRelativeTime(0, 'en', now)).toBe('—')
  })
  it('formats seconds / minutes / hours (en)', () => {
    expect(formatRelativeTime(now, 'en', now)).toBe('now')
    expect(formatRelativeTime(now - 5_000, 'en', now)).toBe('5 seconds ago')
    expect(formatRelativeTime(now - 3 * 60_000, 'en', now)).toBe('3 minutes ago')
    expect(formatRelativeTime(now - 2 * 3_600_000, 'en', now)).toBe('2 hours ago')
  })
  it('localizes the relative string', () => {
    // German renders "vor 3 Minuten".
    expect(formatRelativeTime(now - 3 * 60_000, 'de', now)).toContain('Minuten')
  })
})
