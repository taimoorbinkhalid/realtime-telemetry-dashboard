# Cloud Functions

Server-side logic for the telemetry demo (Cloud Functions **v2**, TypeScript,
Node 22 runtime, region `europe-west1`). Requires the Firebase **Blaze** plan.

## Functions

- **`generateTelemetry`** — scheduled (every 5 minutes). Reads each device's
  current values back from Firestore, wanders them, derives status, and writes a
  new reading plus the denormalized "latest" fields. Also (idempotently) ensures
  device docs and their persisted `thresholds` exist. This is the production data
  source, replacing the local seeder.
- **`onReadingCreated`** — Firestore trigger on
  `devices/{deviceId}/readings/{readingId}`. Evaluates the reading against the
  device's thresholds and maintains the `alerts` collection with stateful
  open / resolve / escalate semantics. A transaction on a per-`(device,metric)`
  pointer doc (`alertState/*`) guarantees at most one active alert per
  device+metric and makes the handler idempotent under at-least-once delivery.

## Layout

- `src/lib/telemetry.ts` — pure drift/status logic + `DEVICE_SPECS`.
- `src/lib/thresholds.ts` — persisted threshold shape + `buildThresholds`.
- `src/lib/alerts.ts` — pure `evaluateMetric` / `decideAlertAction` (unit-tested).
- `src/lib/*.spec.ts` — Vitest tests for the pure logic (no emulator needed).
- `src/config.ts` — region, schedule, collection names.

## Develop

```bash
npm --prefix functions install
npm --prefix functions run build      # tsc → lib/
npm --prefix functions run lint
npm --prefix functions run test:run   # Vitest (pure logic)
```

## Test the trigger against the emulator

The Firestore emulator needs **JDK 21+**:

```bash
firebase emulators:exec --only functions,firestore \
  --project telemetry-monitor-ecfc7 "node your-test-script.mjs"
```

Writing a device (with thresholds) plus a breaching reading should open an
`alerts` doc; an in-range reading should resolve it.

## Deploy

Use `/deploy-backend` (bakes in the personal `--account`), or:

```bash
npx firebase-tools deploy --only functions,firestore:rules,firestore:indexes \
  --project telemetry-monitor-ecfc7 --account taimoorkhalid95@gmail.com
```

First-time deploys of the trigger may need an Eventarc propagation retry — wait
~2 minutes and re-run.
