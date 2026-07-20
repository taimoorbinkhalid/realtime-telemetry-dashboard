/**
 * Pure alert-evaluation core. This is the unit-tested heart of the alerting
 * system: given a reading value + thresholds it decides severity, and given the
 * currently-active alert state it decides what to do (open / resolve / touch /
 * update). No Firebase imports, so it is fully testable in isolation.
 */
import type { MetricThreshold } from './thresholds.js'

export type AlertSeverity = 'warning' | 'critical'
export type AlertMetric = 'temperature' | 'humidity'

/** Result of evaluating a single reading value against a metric threshold. */
export interface MetricEvaluation {
  /** null when the value is within the acceptable band. */
  severity: AlertSeverity | null
  /** The threshold bound that was crossed (base +/- delta), or null. */
  bound: number | null
}

/** The active-alert pointer state for a (device, metric) pair. */
export interface ActiveAlertState {
  activeAlertId: string
  severity: AlertSeverity
}

/** What the trigger should do next, derived purely from state + evaluation. */
export type AlertAction =
  | { type: 'noop' }
  | { type: 'open'; severity: AlertSeverity; bound: number }
  | { type: 'resolve' }
  | { type: 'touch' }
  | { type: 'update'; severity: AlertSeverity; bound: number }

/**
 * Classify a value against its threshold band. Symmetric above and below base:
 * a value that deviates by >= critDelta is critical, >= warnDelta is a warning,
 * otherwise it is in range.
 */
export function evaluateMetric(value: number, threshold: MetricThreshold): MetricEvaluation {
  const delta = Math.abs(value - threshold.base)
  const above = value >= threshold.base
  if (delta >= threshold.critDelta) {
    return { severity: 'critical', bound: above ? threshold.base + threshold.critDelta : threshold.base - threshold.critDelta }
  }
  if (delta >= threshold.warnDelta) {
    return { severity: 'warning', bound: above ? threshold.base + threshold.warnDelta : threshold.base - threshold.warnDelta }
  }
  return { severity: null, bound: null }
}

/**
 * Decide the alert action from the current active state and a fresh evaluation.
 * Guarantees at most one active alert per (device, metric): an existing alert is
 * resolved, touched, or re-graded in place rather than duplicated.
 */
export function decideAlertAction(
  active: ActiveAlertState | null,
  evaluation: MetricEvaluation,
): AlertAction {
  if (!active) {
    if (evaluation.severity === null) return { type: 'noop' }
    return { type: 'open', severity: evaluation.severity, bound: evaluation.bound as number }
  }
  if (evaluation.severity === null) return { type: 'resolve' }
  if (evaluation.severity === active.severity) return { type: 'touch' }
  return { type: 'update', severity: evaluation.severity, bound: evaluation.bound as number }
}
