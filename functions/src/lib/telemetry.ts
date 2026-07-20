/**
 * Pure telemetry-generation logic, mirrored from the local seeder so the
 * scheduled Cloud Function produces the same realistic wander. No Firebase
 * imports here, so it stays unit-testable.
 */

/** A monitored device and its nominal operating point. */
export interface DeviceSpec {
  id: string
  name: string
  location: string
  /** Nominal temperature in degrees Celsius. */
  baseTemp: number
  /** Nominal relative humidity as a percentage. */
  baseHum: number
}

/** The demo fleet. Kept in sync with seeder/seed.ts DEVICE_SPECS. */
export const DEVICE_SPECS: readonly DeviceSpec[] = [
  { id: 'sensor-a1', name: 'Cold Store A1', location: 'Warehouse North', baseTemp: 4, baseHum: 82 },
  { id: 'sensor-b2', name: 'Dry Room B2', location: 'Warehouse North', baseTemp: 21, baseHum: 40 },
  { id: 'sensor-c3', name: 'Server Rack C3', location: 'Data Room', baseTemp: 24, baseHum: 35 },
  { id: 'sensor-d4', name: 'Greenhouse D4', location: 'Site East', baseTemp: 28, baseHum: 65 },
  { id: 'sensor-e5', name: 'Loading Bay E5', location: 'Site East', baseTemp: 16, baseHum: 55 },
  { id: 'sensor-f6', name: 'Freezer F6', location: 'Warehouse South', baseTemp: -18, baseHum: 75 },
] as const

/** Random float in [min, max]. */
export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Wander a value around its base within +/- spread, pulled gently back toward
 * base, clamped to [min, max].
 */
export function drift(current: number, base: number, spread: number, min: number, max: number): number {
  const next = current + rand(-spread, spread) + (base - current) * 0.1
  return Math.min(max, Math.max(min, next))
}

/** Round to a fixed number of decimals, returning a number (not a string). */
export function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals))
}

/** Derive a device status from how far temperature has strayed from its base. */
export function statusFor(temp: number, base: number): 'online' | 'warning' | 'offline' {
  const delta = Math.abs(temp - base)
  if (delta > 6) return 'offline'
  if (delta > 3) return 'warning'
  return 'online'
}
