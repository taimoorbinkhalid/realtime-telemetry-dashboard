import { describe, it, expect } from 'vitest'
import { easeOutCubic } from './useAnimatedNumber'

describe('easeOutCubic', () => {
  it('is pinned at the endpoints', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('eases out (past the midpoint by half-time)', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })

  it('is monotonically increasing', () => {
    let prev = -1
    for (let i = 0; i <= 10; i++) {
      const v = easeOutCubic(i / 10)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
})
