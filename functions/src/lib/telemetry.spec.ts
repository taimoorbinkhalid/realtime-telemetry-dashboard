import { describe, it, expect } from 'vitest'
import { statusFor, drift, round, DEVICE_SPECS } from './telemetry'

describe('statusFor', () => {
  it('is online within +/- 3 of base', () => {
    expect(statusFor(20, 20)).toBe('online')
    expect(statusFor(23, 20)).toBe('online') // delta 3 is not > 3
  })
  it('is warning beyond 3 up to 6', () => {
    expect(statusFor(23.1, 20)).toBe('warning')
    expect(statusFor(26, 20)).toBe('warning') // delta 6 is not > 6
  })
  it('is offline beyond 6', () => {
    expect(statusFor(26.1, 20)).toBe('offline')
    expect(statusFor(10, 20)).toBe('offline')
  })
})

describe('drift', () => {
  it('stays within [min, max]', () => {
    for (let i = 0; i < 200; i++) {
      const v = drift(20, 20, 1.2, 10, 30)
      expect(v).toBeGreaterThanOrEqual(10)
      expect(v).toBeLessThanOrEqual(30)
    }
  })
})

describe('round', () => {
  it('rounds to the given decimals and returns a number', () => {
    expect(round(21.456, 1)).toBe(21.5)
    expect(round(21.454, 2)).toBe(21.45)
    expect(typeof round(1.234, 1)).toBe('number')
  })
})

describe('DEVICE_SPECS', () => {
  it('has six unique device ids', () => {
    const ids = new Set(DEVICE_SPECS.map((d) => d.id))
    expect(ids.size).toBe(6)
  })
})
