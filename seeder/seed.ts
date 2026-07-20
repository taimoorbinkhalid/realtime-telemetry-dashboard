/**
 * Telemetry seeder.
 *
 * Uses the Firebase Admin SDK (which bypasses Firestore security rules) to:
 *   1. Ensure a fixed set of demo devices exists.
 *   2. Every few seconds, push a new reading to each device's `readings`
 *      subcollection and update the device's denormalized "latest" fields.
 *
 * Run it locally against your own Firebase project — it is NOT part of the
 * deployed app. See seeder/README.md for setup.
 *
 * Usage:  npm run seed        (Ctrl-C to stop)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** How often to emit a new reading per device, in milliseconds. */
const TICK_MS = 4000

/** Demo device definitions and their nominal operating points. */
const DEVICE_SPECS = [
  { id: 'sensor-a1', name: 'Cold Store A1', location: 'Warehouse North', baseTemp: 4, baseHum: 82 },
  { id: 'sensor-b2', name: 'Dry Room B2', location: 'Warehouse North', baseTemp: 21, baseHum: 40 },
  { id: 'sensor-c3', name: 'Server Rack C3', location: 'Data Room', baseTemp: 24, baseHum: 35 },
  { id: 'sensor-d4', name: 'Greenhouse D4', location: 'Site East', baseTemp: 28, baseHum: 65 },
  { id: 'sensor-e5', name: 'Loading Bay E5', location: 'Site East', baseTemp: 16, baseHum: 55 },
  { id: 'sensor-f6', name: 'Freezer F6', location: 'Warehouse South', baseTemp: -18, baseHum: 75 },
] as const

/** Load the service-account credentials from the env-pointed key file. */
function loadFirestore(): Firestore {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : resolve(__dirname, '..', 'serviceAccountKey.json')

  let serviceAccount: Record<string, unknown>
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
  } catch {
    console.error(
      `\nCould not read a service-account key at:\n  ${keyPath}\n\n` +
        'Download one from Firebase Console → Project settings → Service accounts →\n' +
        'Generate new private key, save it as serviceAccountKey.json in the project\n' +
        'root (it is gitignored), or point GOOGLE_APPLICATION_CREDENTIALS at it.\n',
    )
    process.exit(1)
  }

  initializeApp({ credential: cert(serviceAccount as never) })
  return getFirestore()
}

/** Random float in [min, max]. */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** Wander a value around its base within +/- spread, clamped to sane bounds. */
function drift(current: number, base: number, spread: number, min: number, max: number): number {
  const next = current + rand(-spread, spread) + (base - current) * 0.1
  return Math.min(max, Math.max(min, next))
}

/** Derive a status from how far temperature has strayed from its base. */
function statusFor(temp: number, base: number): 'online' | 'warning' | 'offline' {
  const delta = Math.abs(temp - base)
  if (delta > 6) return 'offline'
  if (delta > 3) return 'warning'
  return 'online'
}

async function main(): Promise<void> {
  const db = loadFirestore()

  // Seed device docs once, and hold a mutable in-memory state per device.
  const state = new Map<string, { temp: number; hum: number }>()
  for (const spec of DEVICE_SPECS) {
    state.set(spec.id, { temp: spec.baseTemp, hum: spec.baseHum })
    await db.collection('devices').doc(spec.id).set(
      { name: spec.name, location: spec.location },
      { merge: true },
    )
  }
  console.warn(`Seeded ${DEVICE_SPECS.length} devices. Streaming readings every ${TICK_MS}ms…`)

  const tick = async (): Promise<void> => {
    const now = Date.now()
    const batch = db.batch()

    for (const spec of DEVICE_SPECS) {
      const s = state.get(spec.id)!
      s.temp = Number(drift(s.temp, spec.baseTemp, 1.2, spec.baseTemp - 10, spec.baseTemp + 10).toFixed(2))
      s.hum = Number(drift(s.hum, spec.baseHum, 2, 0, 100).toFixed(1))
      const status = statusFor(s.temp, spec.baseTemp)

      const deviceRef = db.collection('devices').doc(spec.id)
      batch.set(
        deviceRef,
        { temperature: s.temp, humidity: s.hum, status, lastReadingAt: now },
        { merge: true },
      )
      // Auto-id reading in the subcollection.
      batch.set(deviceRef.collection('readings').doc(), {
        temperature: s.temp,
        humidity: s.hum,
        recordedAt: now,
      })
    }

    await batch.commit()
    console.warn(`  ↳ wrote readings @ ${new Date(now).toLocaleTimeString()}`)
  }

  await tick()
  setInterval(() => {
    tick().catch((err) => console.error('Tick failed:', err))
  }, TICK_MS)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
