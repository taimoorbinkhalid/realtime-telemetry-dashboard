/**
 * Alert data-access layer. All Firestore reads for alerts live here; the store
 * and components consume these subscriptions and never touch the SDK directly.
 * Alerts are written only by Cloud Functions.
 */
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Alert, AlertMetric, AlertSeverity, AlertStatus } from '@/types'

const ALERTS = 'alerts'

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toSeverity(value: unknown): AlertSeverity {
  return value === 'critical' ? 'critical' : 'warning'
}

function toMetric(value: unknown): AlertMetric {
  return value === 'humidity' ? 'humidity' : 'temperature'
}

function toAlertStatus(value: unknown): AlertStatus {
  return value === 'resolved' ? 'resolved' : 'active'
}

function mapAlert(snap: QueryDocumentSnapshot<DocumentData>): Alert {
  const data = snap.data()
  return {
    id: snap.id,
    deviceId: typeof data.deviceId === 'string' ? data.deviceId : '',
    deviceName: typeof data.deviceName === 'string' ? data.deviceName : data.deviceId ?? '—',
    metric: toMetric(data.metric),
    severity: toSeverity(data.severity),
    status: toAlertStatus(data.status),
    value: toNumber(data.value),
    bound: toNumber(data.bound),
    message: typeof data.message === 'string' ? data.message : '',
    createdAt: toNumber(data.createdAt),
    resolvedAt: typeof data.resolvedAt === 'number' ? data.resolvedAt : null,
  }
}

/** Live-subscribe to all active alerts, newest first. */
export function subscribeToActiveAlerts(
  onData: (alerts: Alert[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, ALERTS), where('status', '==', 'active'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(mapAlert)),
    (error) => onError(error),
  )
}

/** Live-subscribe to the most recent resolved alerts, newest first. */
export function subscribeToRecentResolvedAlerts(
  max: number,
  onData: (alerts: Alert[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, ALERTS),
    where('status', '==', 'resolved'),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(mapAlert)),
    (error) => onError(error),
  )
}
