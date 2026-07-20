/**
 * Device / telemetry data-access layer. All Firestore reads for the dashboard
 * live here. Components and stores consume these subscriptions and never import
 * `firestore` primitives themselves.
 */
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Device, DeviceStatus, Reading } from '@/types'

const DEVICES = 'devices'
const READINGS = 'readings'

/** Coerce an unknown Firestore value into a finite number, or a fallback. */
function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Normalize a raw status string into a known DeviceStatus. */
function toStatus(value: unknown): DeviceStatus {
  return value === 'online' || value === 'warning' || value === 'offline' ? value : 'offline'
}

/** Map a device document snapshot into a typed Device. */
function mapDevice(snap: QueryDocumentSnapshot<DocumentData>): Device {
  const data = snap.data()
  return {
    id: snap.id,
    name: typeof data.name === 'string' ? data.name : snap.id,
    location: typeof data.location === 'string' ? data.location : '—',
    status: toStatus(data.status),
    temperature: toNumber(data.temperature),
    humidity: toNumber(data.humidity),
    lastReadingAt: toNumber(data.lastReadingAt),
  }
}

/** Map a reading document snapshot into a typed Reading. */
function mapReading(snap: QueryDocumentSnapshot<DocumentData>): Reading {
  const data = snap.data()
  return {
    id: snap.id,
    temperature: toNumber(data.temperature),
    humidity: toNumber(data.humidity),
    recordedAt: toNumber(data.recordedAt),
  }
}

/**
 * Live-subscribe to all devices, ordered by name. Returns an unsubscribe fn.
 * `onError` surfaces permission/network failures to the caller for UI handling.
 */
export function subscribeToDevices(
  onData: (devices: Device[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, DEVICES), orderBy('name'))
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(mapDevice)),
    (error) => onError(error),
  )
}

/**
 * Live-subscribe to a single device document. Returns an unsubscribe fn.
 * Emits `null` when the device does not exist.
 */
export function subscribeToDevice(
  deviceId: string,
  onData: (device: Device | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, DEVICES, deviceId),
    (snapshot) => onData(snapshot.exists() ? mapDevice(snapshot) : null),
    (error) => onError(error),
  )
}

/**
 * Live-subscribe to a device's most recent readings (newest first), capped at
 * `max`. The chart consumes this reversed into chronological order.
 */
export function subscribeToReadings(
  deviceId: string,
  max: number,
  onData: (readings: Reading[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, DEVICES, deviceId, READINGS),
    orderBy('recordedAt', 'desc'),
    limit(max),
  )
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(mapReading)),
    (error) => onError(error),
  )
}

/**
 * Live-subscribe to a device's readings since a given epoch-ms cutoff (newest
 * first, capped at `max`). Uses the existing single-field `recordedAt` index, so
 * no new composite index is required.
 */
export function subscribeToReadingsInRange(
  deviceId: string,
  sinceEpochMs: number,
  max: number,
  onData: (readings: Reading[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, DEVICES, deviceId, READINGS),
    where('recordedAt', '>=', sinceEpochMs),
    orderBy('recordedAt', 'desc'),
    limit(max),
  )
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(mapReading)),
    (error) => onError(error),
  )
}
