/**
 * Domain types for the telemetry demo.
 *
 * A `Device` is a monitored unit (e.g. a sensor node). Each device owns a
 * time-ordered stream of `Reading` documents written by the seeder.
 */

/** Operational state of a device, derived from its latest reading. */
export type DeviceStatus = 'online' | 'warning' | 'offline'

/** A monitored device as stored in the `devices` collection. */
export interface Device {
  /** Firestore document id. */
  id: string
  /** Human-readable name shown on the card. */
  name: string
  /** Free-text location label (e.g. "Warehouse A"). */
  location: string
  /** Current operational status. */
  status: DeviceStatus
  /** Most recent temperature reading, in degrees Celsius. */
  temperature: number
  /** Most recent relative humidity reading, as a percentage. */
  humidity: number
  /** Epoch millis of the last reading; drives the "last seen" display. */
  lastReadingAt: number
}

/** A single telemetry sample in a device's `readings` subcollection. */
export interface Reading {
  /** Firestore document id. */
  id: string
  /** Temperature at sample time, in degrees Celsius. */
  temperature: number
  /** Relative humidity at sample time, as a percentage. */
  humidity: number
  /** Epoch millis when the sample was recorded. */
  recordedAt: number
}

/** Metrics that can raise an alert. */
export type AlertMetric = 'temperature' | 'humidity'
/** Alert severities, ordered least to most serious. */
export type AlertSeverity = 'warning' | 'critical'
/** Lifecycle state of an alert. */
export type AlertStatus = 'active' | 'resolved'

/**
 * An alert raised by the Cloud Function when a reading breaches a device
 * threshold. Written only server-side; the client reads these.
 */
export interface Alert {
  /** Firestore document id. */
  id: string
  deviceId: string
  /** Denormalized device name for list display. */
  deviceName: string
  metric: AlertMetric
  severity: AlertSeverity
  status: AlertStatus
  /** Reading value at the last update. */
  value: number
  /** Threshold bound that was crossed. */
  bound: number
  /** Human-readable summary. */
  message: string
  /** Epoch millis when the alert opened. */
  createdAt: number
  /** Epoch millis when it resolved, or null while active. */
  resolvedAt: number | null
}

/** Threshold band for a single metric, relative to a baseline. */
export interface MetricThreshold {
  base: number
  warnDelta: number
  critDelta: number
}

/** Per-device thresholds persisted on the device document. */
export interface DeviceThresholds {
  temperature: MetricThreshold
  humidity: MetricThreshold
}

/** Aggregate fleet statistics, computed server-side. */
export interface FleetStats {
  total: number
  online: number
  warning: number
  offline: number
  /** Average temperature across the fleet, in degrees Celsius. */
  avgTemperature: number
  /** Average relative humidity across the fleet, as a percentage. */
  avgHumidity: number
}

/** Selectable window for the device history chart. */
export type TimeRange = '1h' | '6h' | '24h'

/** Per-user preferences stored under /users/{uid}/settings/preferences. */
export interface UserPreferences {
  /** Default time range for the device chart. */
  defaultTimeRange: TimeRange
  /** Show only favorited devices on the dashboard by default. */
  favoritesOnly: boolean
}
