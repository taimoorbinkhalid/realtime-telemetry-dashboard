# Architecture

A concise tour of how the telemetry dashboard is put together: the stack, the
data model, how data flows in real time, the security model, and where things
live.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | **Vue 3** (Composition API, `<script setup>`) | Modern, typed, reactive |
| Components | **Vuetify 4** | Batteries-included Material UI; consistent theming |
| Language | **TypeScript** (strict) | Type safety across app + seeder |
| State | **Pinia** | Lightweight, typed store; one listener shared across components |
| Routing | **Vue Router** with an auth guard | Protects the dashboard behind sign-in |
| Data / backend | **Firebase** — Auth, Firestore, Hosting | Real-time reads via `onSnapshot` |
| Server logic | **Cloud Functions v2** | Scheduled telemetry + event-driven alerting |
| Charts | **Chart.js** via `vue-chartjs` | History line chart + status donut |
| i18n / PWA | **vue-i18n**, **vite-plugin-pwa** | Keyed UI text; installable, offline app shell |
| Build / test | **Vite**, **Vitest**, **ESLint** | Fast dev loop; CI-enforced quality gates |

## Data model (Firestore)

```
devices/{deviceId}
  ├─ name, location: string
  ├─ status: "online" | "warning" | "offline"   # derived from latest reading
  ├─ temperature, humidity: number   # latest sample (denormalized for the grid)
  ├─ lastReadingAt: number           # epoch millis
  ├─ thresholds: { temperature: {base,warnDelta,critDelta}, humidity: {…} }
  └─ readings/{readingId}            # time-ordered history subcollection
       ├─ temperature, humidity: number
       └─ recordedAt: number         # epoch millis

alerts/{alertId}                     # written only by Cloud Functions
  ├─ deviceId, deviceName, metric, severity, status
  ├─ value, bound, message: …
  └─ createdAt, resolvedAt: number   # epoch millis

alertState/{deviceId}__{metric}      # internal pointer; denied to all clients
  └─ { activeAlertId, severity, lastRecordedAt }

users/{uid}/                         # owner-scoped; the only client-writable data
  ├─ favorites/{deviceId}
  ├─ acknowledgedAlerts/{alertId}
  └─ settings/preferences
```

Timestamps are **epoch-millis numbers** everywhere (never Firestore
`Timestamp`), so the client mappers and the functions agree. Latest values are
**denormalized** onto each `devices/{id}` document so the grid renders from a
single subscription. Thresholds are persisted on the device so the alert
function has baselines to evaluate against.

## Data flow

```
┌────────────┐   Admin SDK writes    ┌───────────┐   onSnapshot (real-time)   ┌─────────────────┐
│  Seeder    │ ────────────────────▶ │ Firestore │ ─────────────────────────▶ │ services/*.ts   │
│ (Node,     │  (bypasses rules)     │           │   (client, read-only)      │ (data-access)   │
│  Admin SDK)│                       └───────────┘                            └────────┬────────┘
└────────────┘                                                                         │
                                                                                       ▼
                                                                              ┌─────────────────┐
                                                                              │ Pinia stores    │
                                                                              │ (devices, auth) │
                                                                              └────────┬────────┘
                                                                                       ▼
                                                                              ┌─────────────────┐
                                                                              │ Views / cards / │
                                                                              │ chart (reactive)│
                                                                              └─────────────────┘
```

1. In production, the scheduled Cloud Function **`generateTelemetry`** writes
   randomized telemetry (the local **seeder** does the same job for dev). Both
   use the Admin SDK and bypass rules.
2. Each new reading fires the **`onReadingCreated`** trigger, which evaluates it
   against the device's thresholds and maintains the `alerts` collection
   (open / resolve / escalate) via a transaction on a per-metric pointer doc, so
   there is at most one active alert per device+metric and delivery is idempotent.
3. The client subscribes to Firestore through the **service layer**
   (`src/services/`); nothing else imports the Firestore SDK directly. Fleet KPIs
   use server-side **aggregation queries** rather than pulling every document.
4. Services push updates into **Pinia stores** (devices, alerts, user, auth),
   which own the subscription lifecycle (shared listeners, torn down on sign-out).
5. **Components** read reactive store state and re-render on every snapshot. The
   only client writes are per-user favorites / acknowledgements / preferences.

## Security model

- Firestore rules (`firestore.rules`) grant **read to any signed-in user** on
  `devices`, `readings`, and `alerts`, and **deny client writes** to them
  (`allow write: if false`). The internal `alertState` pointers are denied to
  clients entirely by the default-deny rule.
- The only client-writable data is `/users/{uid}/…`, guarded by an
  **owner-scoped** rule (`request.auth.uid == userId`): a user can read and write
  only their own favorites, acknowledgements, and preferences.
- All telemetry/alert writes come from the trusted seeder or Cloud Functions via
  the Admin SDK, which bypasses rules. The public demo is tamper-proof: visitors
  view live data and manage their own preferences, but cannot alter the fleet.
- The Firebase **web config** (API key, etc.) is public by design and shipped
  in the bundle; it is not a secret. The service-account key **is** a secret and
  is gitignored, never committed, never shipped to the client.
- Auth is email/password. A pre-created demo account powers the one-click
  **Demo login** so visitors need not register.

## Project structure

```
src/
  services/      Firebase init + data-access modules (device, alert, analytics, user)
  stores/        Pinia stores (auth, devices, alerts, user) — subscriptions + state
  views/         Route screens (Login, Overview, Dashboard, DeviceDetail, Alerts, Settings)
  components/    Presentational units (DeviceCard, StatusChip, SeverityChip,
                 TelemetryChart, StatusDonut, KpiTile, NotificationBell, AnimatedNumber)
  composables/   Reusable logic (theme, device filters, animated numbers)
  plugins/       Vuetify + theme token setup
  i18n/          vue-i18n config + locale strings
  utils/         Pure helpers (formatting, CSV)
  types/         Shared domain types (Device, Reading, Alert, FleetStats, …)
functions/       Cloud Functions v2 (generateTelemetry, onReadingCreated) + pure logic
seeder/          Standalone Admin-SDK telemetry generator (local dev)
firestore.rules  Client read-only for fleet data; owner-scoped /users/{uid}
```

## Conventions

- **Data access is isolated in `src/services/`** — UI and stores never touch the
  Firebase SDK directly, which keeps components testable and the data layer swappable.
- **No inline hex colors** — theme tokens live in `src/plugins/theme.ts`.
- **All user-visible text is i18n-keyed.**
- **Pure logic is unit-tested** (see `src/**/*.spec.ts`); stores are tested with
  the service layer mocked.
