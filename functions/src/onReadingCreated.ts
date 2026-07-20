/**
 * Firestore trigger: on each new reading, evaluate it against the device's
 * persisted thresholds and maintain the `alerts` collection with stateful
 * open/resolve semantics.
 *
 * Idempotency + no-duplicates are guaranteed by a per-(device,metric) pointer
 * doc in `alertState`: all reads/writes for a metric happen inside a
 * transaction on that single doc, and a `lastRecordedAt` guard drops
 * re-delivered or out-of-order events (onDocumentCreated is at-least-once).
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { REGION, DEVICES, READINGS, ALERTS, ALERT_STATE } from './config.js'
import { decideAlertAction, evaluateMetric, type AlertMetric } from './lib/alerts.js'
import type { DeviceThresholds } from './lib/thresholds.js'

const METRICS: AlertMetric[] = ['temperature', 'humidity']
const UNIT: Record<AlertMetric, string> = { temperature: '°C', humidity: '%' }

/** Human-readable alert message. */
function buildMessage(deviceName: string, metric: AlertMetric, value: number, bound: number): string {
  const u = UNIT[metric]
  const direction = value >= bound ? 'above' : 'below'
  return `${deviceName} ${metric} ${value}${u} is ${direction} the ${bound}${u} threshold`
}

export const onReadingCreated = onDocumentCreated(
  { document: `${DEVICES}/{deviceId}/${READINGS}/{readingId}`, region: REGION, maxInstances: 5 },
  async (event) => {
    const snap = event.data
    if (!snap) return
    const reading = snap.data()
    const deviceId = event.params.deviceId
    const readingId = event.params.readingId
    const recordedAt = typeof reading.recordedAt === 'number' ? reading.recordedAt : Date.now()

    const db = getFirestore()
    const deviceSnap = await db.collection(DEVICES).doc(deviceId).get()
    const device = deviceSnap.data()
    if (!device?.thresholds) return // no baselines persisted yet; nothing to evaluate
    const thresholds = device.thresholds as DeviceThresholds
    const deviceName = typeof device.name === 'string' ? device.name : deviceId

    for (const metric of METRICS) {
      const value = reading[metric]
      if (typeof value !== 'number') continue
      await processMetric(db, {
        deviceId,
        deviceName,
        metric,
        value,
        base: thresholds[metric].base,
        recordedAt,
        readingId,
        evaluation: evaluateMetric(value, thresholds[metric]),
      })
    }
  },
)

interface ProcessArgs {
  deviceId: string
  deviceName: string
  metric: AlertMetric
  value: number
  base: number
  recordedAt: number
  readingId: string
  evaluation: ReturnType<typeof evaluateMetric>
}

/** Apply the decided action inside a transaction on the pointer doc. */
async function processMetric(db: Firestore, a: ProcessArgs): Promise<void> {
  const stateRef = db.collection(ALERT_STATE).doc(`${a.deviceId}__${a.metric}`)

  await db.runTransaction(async (tx) => {
    const stateSnap = await tx.get(stateRef)
    const state = stateSnap.data()

    // Idempotency / ordering guard: ignore replays and out-of-order events.
    if (state && typeof state.lastRecordedAt === 'number' && a.recordedAt <= state.lastRecordedAt) {
      return
    }

    const active =
      state?.activeAlertId
        ? { activeAlertId: state.activeAlertId as string, severity: state.severity }
        : null
    const action = decideAlertAction(active, a.evaluation)
    const now = Date.now()

    switch (action.type) {
      case 'noop':
        tx.set(stateRef, { lastRecordedAt: a.recordedAt }, { merge: true })
        break
      case 'open': {
        const alertRef = db.collection(ALERTS).doc()
        tx.set(alertRef, {
          deviceId: a.deviceId,
          deviceName: a.deviceName,
          metric: a.metric,
          severity: action.severity,
          status: 'active',
          value: a.value,
          base: a.base,
          bound: action.bound,
          message: buildMessage(a.deviceName, a.metric, a.value, action.bound),
          createdAt: now,
          updatedAt: now,
          resolvedAt: null,
          resolvedValue: null,
          triggeringReadingId: a.readingId,
        })
        tx.set(stateRef, { activeAlertId: alertRef.id, severity: action.severity, lastRecordedAt: a.recordedAt })
        break
      }
      case 'resolve': {
        const alertRef = db.collection(ALERTS).doc(state!.activeAlertId)
        tx.set(alertRef, { status: 'resolved', resolvedAt: now, resolvedValue: a.value, updatedAt: now }, { merge: true })
        tx.set(stateRef, { activeAlertId: null, severity: null, lastRecordedAt: a.recordedAt }, { merge: true })
        break
      }
      case 'touch': {
        const alertRef = db.collection(ALERTS).doc(state!.activeAlertId)
        tx.set(alertRef, { value: a.value, updatedAt: now }, { merge: true })
        tx.set(stateRef, { lastRecordedAt: a.recordedAt }, { merge: true })
        break
      }
      case 'update': {
        const alertRef = db.collection(ALERTS).doc(state!.activeAlertId)
        tx.set(
          alertRef,
          {
            severity: action.severity,
            value: a.value,
            bound: action.bound,
            message: buildMessage(a.deviceName, a.metric, a.value, action.bound),
            updatedAt: now,
          },
          { merge: true },
        )
        tx.set(stateRef, { severity: action.severity, lastRecordedAt: a.recordedAt }, { merge: true })
        break
      }
    }
  })
}
