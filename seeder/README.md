# Telemetry seeder

A small Node script that generates fake device telemetry and writes it to your
Firestore, so the dashboard has live data to display. It uses the Firebase
**Admin SDK**, which bypasses security rules, so the client can stay read-only.

## Setup

1. In the [Firebase Console](https://console.firebase.google.com/), open your
   project → **Project settings → Service accounts → Generate new private key**.
2. Save the downloaded JSON as `serviceAccountKey.json` in the **project root**
   (one level up from this folder). It is already gitignored — never commit it.
   - Alternatively, point `GOOGLE_APPLICATION_CREDENTIALS` at the file path.
3. From the project root, run:

   ```bash
   npm run seed
   ```

You should see it seed six demo devices and then stream a new batch of readings
every few seconds. Leave it running while you use the dashboard; press
`Ctrl-C` to stop.

> **Do not run this against production while the scheduled Cloud Function
> (`generateTelemetry`) is deployed.** Both would write readings, doubling data
> and making device status / alerts flap. Use the seeder for local development
> against the Firestore emulator (or a separate dev project) only.

## What it writes

- `devices/{id}` — one doc per device with denormalized latest values
  (`name`, `location`, `status`, `temperature`, `humidity`, `lastReadingAt`).
- `devices/{id}/readings/{auto-id}` — one doc per sample
  (`temperature`, `humidity`, `recordedAt`).

The values wander realistically around each device's nominal operating point,
and `status` is derived from how far temperature has drifted.
