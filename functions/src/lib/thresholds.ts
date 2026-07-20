/**
 * Per-device alert thresholds, persisted onto each device document so the
 * trigger function has baselines to evaluate against (baselines used to live
 * only in the seeder). Pure module, no Firebase imports.
 */
import type { DeviceSpec } from './telemetry.js'

/** Threshold band for a single metric, relative to a persisted baseline. */
export interface MetricThreshold {
  /** Nominal value for the metric. */
  base: number
  /** Absolute deviation from base at which the metric is a warning. */
  warnDelta: number
  /** Absolute deviation from base at which the metric is critical. */
  critDelta: number
}

/** Thresholds for every monitored metric of a device. */
export interface DeviceThresholds {
  temperature: MetricThreshold
  humidity: MetricThreshold
}

/**
 * Build the thresholds object for a device. Temperature deltas mirror the
 * seeder's status logic (warn > 3, critical > 6); humidity gets a wider band.
 */
export function buildThresholds(spec: DeviceSpec): DeviceThresholds {
  return {
    temperature: { base: spec.baseTemp, warnDelta: 3, critDelta: 6 },
    humidity: { base: spec.baseHum, warnDelta: 10, critDelta: 20 },
  }
}
