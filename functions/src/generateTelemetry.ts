/**
 * Scheduled telemetry generator. Runs server-side so the live demo streams
 * without the local seeder. Stateless across cold starts: it reads each
 * device's current value back from Firestore, wanders it, and writes a new
 * reading plus the denormalized "latest" fields. It also (idempotently) ensures
 * device docs and their persisted thresholds exist.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'
import { REGION, SCHEDULE, DEVICES, READINGS } from './config'
import { DEVICE_SPECS, drift, round, statusFor } from './lib/telemetry'
import { buildThresholds } from './lib/thresholds'

export const generateTelemetry = onSchedule(
  { schedule: SCHEDULE, region: REGION, maxInstances: 1, memory: '256MiB', timeoutSeconds: 60 },
  async () => {
    const db = getFirestore()
    const now = Date.now()

    const refs = DEVICE_SPECS.map((spec) => db.collection(DEVICES).doc(spec.id))
    const snaps = await db.getAll(...refs)

    const batch = db.batch()
    DEVICE_SPECS.forEach((spec, i) => {
      const data = snaps[i].data() ?? {}
      const curTemp = typeof data.temperature === 'number' ? data.temperature : spec.baseTemp
      const curHum = typeof data.humidity === 'number' ? data.humidity : spec.baseHum

      const temperature = round(drift(curTemp, spec.baseTemp, 1.2, spec.baseTemp - 10, spec.baseTemp + 10), 2)
      const humidity = round(drift(curHum, spec.baseHum, 2, 0, 100), 1)
      const status = statusFor(temperature, spec.baseTemp)

      const ref = refs[i]
      // Merge keeps device metadata + thresholds present and up to date.
      batch.set(
        ref,
        {
          name: spec.name,
          location: spec.location,
          thresholds: buildThresholds(spec),
          temperature,
          humidity,
          status,
          lastReadingAt: now,
        },
        { merge: true },
      )
      batch.set(ref.collection(READINGS).doc(), { temperature, humidity, recordedAt: now })
    })

    await batch.commit()
  },
)
