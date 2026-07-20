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
