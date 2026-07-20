/**
 * Fleet analytics via Firestore server-side aggregation queries
 * (`getCountFromServer` / `getAggregateFromServer`). These are one-shot reads
 * (Promises), not live subscriptions, and are far cheaper than pulling every
 * document to the client to count/average.
 */
import {
  average,
  collection,
  getAggregateFromServer,
  getCountFromServer,
  query,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { DeviceStatus, FleetStats } from '@/types'

const DEVICES = 'devices'

/** Count of devices in a given status, computed server-side. */
async function countByStatus(status: DeviceStatus): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, DEVICES), where('status', '==', status)))
  return snap.data().count
}

/**
 * Compute fleet-wide statistics: total device count, counts per status, and
 * average temperature/humidity, all aggregated on the server.
 */
export async function getFleetStats(): Promise<FleetStats> {
  const devices = collection(db, DEVICES)
  const [total, online, warning, offline, agg] = await Promise.all([
    getCountFromServer(devices),
    countByStatus('online'),
    countByStatus('warning'),
    countByStatus('offline'),
    getAggregateFromServer(devices, {
      avgTemperature: average('temperature'),
      avgHumidity: average('humidity'),
    }),
  ])
  return {
    total: total.data().count,
    online,
    warning,
    offline,
    avgTemperature: agg.data().avgTemperature ?? 0,
    avgHumidity: agg.data().avgHumidity ?? 0,
  }
}
