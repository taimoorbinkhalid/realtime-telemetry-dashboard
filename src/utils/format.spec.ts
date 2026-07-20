import { describe, it, expect } from 'vitest'
import { formatTemperature, formatHumidity, formatRelativeTime } from './format'

describe('formatTemperature', () => {
  it('formats to one decimal place with a °C suffix', () => {
    expect(formatTemperature(21.4)).toBe('21.4°C')
  })

  it('rounds to one decimal', () => {
    expect(formatTemperature(21.46)).toBe('21.5°C')
    expect(formatTemperature(21.44)).toBe('21.4°C')
  })

  it('handles negative and zero values', () => {
    expect(formatTemperature(0)).toBe('0.0°C')
    expect(formatTemperature(-3.2)).toBe('-3.2°C')
  })
})

describe('formatHumidity', () => {
  it('rounds to a whole percentage', () => {
    expect(formatHumidity(48.2)).toBe('48%')
    expect(formatHumidity(48.6)).toBe('49%')
  })

  it('handles the bounds', () => {
    expect(formatHumidity(0)).toBe('0%')
    expect(formatHumidity(100)).toBe('100%')
  })
})

describe('formatRelativeTime', () => {
  // A fixed "now" so the relative math is deterministic.
  const now = 1_700_000_000_000

  it('returns an em-dash placeholder for a falsy timestamp', () => {
    expect(formatRelativeTime(0, now)).toBe('—')
  })

  it('reports "just now" within the first 10 seconds', () => {
    expect(formatRelativeTime(now - 5_000, now)).toBe('just now')
  })

  it('reports seconds under a minute', () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe('30s ago')
  })

  it('reports minutes under an hour', () => {
    expect(formatRelativeTime(now - 3 * 60_000, now)).toBe('3 min ago')
  })

  it('reports hours under a day', () => {
    expect(formatRelativeTime(now - 2 * 60 * 60_000, now)).toBe('2 h ago')
  })

  it('falls back to a localized date string beyond a day', () => {
    const result = formatRelativeTime(now - 48 * 60 * 60_000, now)
    expect(result).not.toMatch(/ago|just now/)
    expect(result.length).toBeGreaterThan(0)
  })

  it('never produces a negative duration for future-ish clock skew', () => {
    expect(formatRelativeTime(now + 5_000, now)).toBe('just now')
  })
})
