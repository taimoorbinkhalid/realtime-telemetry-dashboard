/**
 * Cloud Functions entry point. Initializes the Admin SDK and exports the two
 * functions: a scheduled telemetry generator and a Firestore-triggered alert
 * evaluator.
 */
import { initializeApp } from 'firebase-admin/app'
import { setGlobalOptions } from 'firebase-functions/v2'
import { REGION } from './config.js'

initializeApp()
setGlobalOptions({ region: REGION, maxInstances: 10 })

export { generateTelemetry } from './generateTelemetry.js'
export { onReadingCreated } from './onReadingCreated.js'
