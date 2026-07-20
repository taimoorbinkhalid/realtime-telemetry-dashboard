import { describe, it, expect } from 'vitest'
import { evaluateMetric, decideAlertAction, type ActiveAlertState } from './alerts'
import type { MetricThreshold } from './thresholds'

const t: MetricThreshold = { base: 20, warnDelta: 3, critDelta: 6 }

describe('evaluateMetric', () => {
  it('returns no severity when within band', () => {
    expect(evaluateMetric(20, t)).toEqual({ severity: null, bound: null })
    expect(evaluateMetric(22.9, t)).toEqual({ severity: null, bound: null })
    expect(evaluateMetric(17.1, t)).toEqual({ severity: null, bound: null })
  })

  it('flags a warning at exactly warnDelta, above and below', () => {
    expect(evaluateMetric(23, t)).toEqual({ severity: 'warning', bound: 23 })
    expect(evaluateMetric(17, t)).toEqual({ severity: 'warning', bound: 17 })
  })

  it('flags critical at exactly critDelta, above and below', () => {
    expect(evaluateMetric(26, t)).toEqual({ severity: 'critical', bound: 26 })
    expect(evaluateMetric(14, t)).toEqual({ severity: 'critical', bound: 14 })
  })

  it('prefers critical over warning when both bands are crossed', () => {
    expect(evaluateMetric(40, t).severity).toBe('critical')
  })
})

describe('decideAlertAction', () => {
  const active: ActiveAlertState = { activeAlertId: 'a1', severity: 'warning' }

  it('noop when nothing active and in range', () => {
    expect(decideAlertAction(null, { severity: null, bound: null })).toEqual({ type: 'noop' })
  })

  it('opens when nothing active and out of range', () => {
    expect(decideAlertAction(null, { severity: 'warning', bound: 23 })).toEqual({
      type: 'open',
      severity: 'warning',
      bound: 23,
    })
  })

  it('resolves when active and back in range', () => {
    expect(decideAlertAction(active, { severity: null, bound: null })).toEqual({ type: 'resolve' })
  })

  it('touches when active and severity unchanged', () => {
    expect(decideAlertAction(active, { severity: 'warning', bound: 23 })).toEqual({ type: 'touch' })
  })

  it('updates (escalates/de-escalates) when active severity changes', () => {
    expect(decideAlertAction(active, { severity: 'critical', bound: 26 })).toEqual({
      type: 'update',
      severity: 'critical',
      bound: 26,
    })
  })
})
