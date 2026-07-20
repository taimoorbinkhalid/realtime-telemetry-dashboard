/**
 * Central function configuration. The Firestore database is the `eur3`
 * multi-region, so functions run in `europe-west1` (within that footprint) to
 * co-locate the Firestore trigger.
 */

/** Compute region for all functions. If a deploy complains about the trigger
 * location not matching the `eur3` database, change this to `eur3`. */
export const REGION = 'europe-west1'

/** Scheduled telemetry cadence. Cloud Scheduler minimum is 1 minute; 2 minutes
 * keeps writes within the Firestore free tier. */
export const SCHEDULE = 'every 2 minutes'

// Collection names, single-sourced.
export const DEVICES = 'devices'
export const READINGS = 'readings'
export const ALERTS = 'alerts'
/** Internal per-(device,metric) pointer collection; denied to clients by rules. */
export const ALERT_STATE = 'alertState'
