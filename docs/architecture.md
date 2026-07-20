# Architecture

A tour of how the telemetry dashboard is put together: the stack, the data
model, how data flows in real time, the security model, localization, the PWA,
deployment, and where things live.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | **Vue 3** (Composition API, `<script setup>`) | Modern, typed, reactive |
| Components | **Vuetify 4** | Batteries-included Material UI; consistent theming |
| Language | **TypeScript** (strict) | Type safety across app, functions, and seeder |
| State | **Pinia** | Typed stores; one shared listener per collection |
| Routing | **Vue Router** with an auth guard | Protects the app behind sign-in |
| Data / backend | **Firebase** — Auth, Firestore, Hosting | Real-time reads via `onSnapshot` |
| Server logic | **Cloud Functions v2** (Node 22) | Scheduled telemetry + event-driven alerting |
| Charts | **Chart.js** via `vue-chartjs` | History line chart + status donut |
| i18n | **vue-i18n** (6 locales) | Keyed UI text; `Intl`-based locale-aware formatting |
| PWA | **vite-plugin-pwa** | Installable, offline app shell |
| Build / test | **Vite**, **Vitest**, **ESLint** | Fast dev loop; CI-enforced quality gates |

App tooling runs on **Node 24** (`.nvmrc`); the Cloud Functions runtime is
**Node 22** (GCF max). TypeScript is pinned to `~6.0.0` (the ESLint TS tooling
does not yet support TS 7).

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
  └─ settings/preferences            # { defaultTimeRange, favoritesOnly }
```

Timestamps are **epoch-millis numbers** everywhere (never Firestore
`Timestamp`), so the client mappers and the functions agree. Latest values are
**denormalized** onto each `devices/{id}` document so the grid renders from a
single subscription. Thresholds are persisted on the device so the alert
function has baselines to evaluate against.

## Data flow

```
┌──────────────────────┐
│ generateTelemetry     │  (scheduled, every 5 min, Admin SDK — prod writer)
│ seeder/seed.ts        │  (local dev only, every 4s — same writes)
└──────────┬───────────┘
           │ writes devices + readings (bypass rules)
           ▼
     ┌───────────┐   onDocumentCreated    ┌──────────────────┐
     │ Firestore │ ─────────────────────▶ │ onReadingCreated  │ evaluates thresholds,
     │           │                        │ (Cloud Function)  │ maintains alerts/*
     │           │ ◀───────────────────── │                   │ (open/resolve/escalate)
     └─────┬─────┘   writes alerts         └──────────────────┘
           │ onSnapshot (real-time)   +  getAggregateFromServer (Overview KPIs)
           ▼
   ┌─────────────────┐     ┌──────────────────────────────┐
   │ services/*.ts   │ ──▶ │ Pinia stores                  │
   │ (data-access)   │     │ auth · devices · alerts · user │
   └─────────────────┘     └───────────────┬───────────────┘
                                           ▼
                              ┌─────────────────────────────┐
                              │ views / components (reactive) │
                              └─────────────────────────────┘
```

1. In production the scheduled **`generateTelemetry`** writes telemetry every
   5 minutes; the local **seeder** does the same for dev (every 4s). Both use the
   Admin SDK and bypass rules. Do not run the seeder against prod while the
   function is deployed (double-writes).
2. Each new reading fires **`onReadingCreated`**, which evaluates it against the
   device's persisted thresholds and maintains the `alerts` collection via a
   transaction on a per-`(device,metric)` pointer doc — at most one active alert
   per device+metric, idempotent against at-least-once/out-of-order delivery.
3. The client reads Firestore only through the **service layer** (`src/services/`).
   Live views use `onSnapshot`; the Overview's fleet KPIs use server-side
   **aggregation queries** (`getCountFromServer` / `getAggregateFromServer`) and
   re-run whenever the live device stream changes.
4. Services feed **Pinia stores** (auth, devices, alerts, user), which own the
   subscription lifecycle (shared listeners, torn down on sign-out).
5. The only client writes are per-user favorites / acknowledgements / preferences.

## Routing & state

Routes (all lazy, protected by default; opt out with `meta.public`):

| Path | Name | View |
|---|---|---|
| `/` | overview | Fleet KPIs + status donut + alert summary |
| `/devices` | dashboard | Device grid (search / filter / sort / CSV) |
| `/devices/:id` | device | Detail + 1h/6h/24h history chart |
| `/alerts` | alerts | Active + recently-resolved feed (acknowledge) |
| `/settings` | settings | Account + preferences |
| `/login` | login | Email/password + one-click demo |

- **auth** store exposes a `ready` promise the router guard awaits, so a hard
  refresh doesn't bounce to `/login` before auth is known.
- **devices** / **alerts** stores each own a single idempotent `subscribe()` and
  a `reset()` (called on sign-out); many components share the one listener.
- **user** store holds favorites / acknowledgements / preferences and is the only
  place that writes (owner-scoped).

## Localization (i18n)

- Six locales: **en, de, fr, pl, it, es** (`src/i18n/locales/*.ts`), all keyed
  under domain namespaces; no hardcoded UI strings.
- The active locale resolves from saved choice → browser language → English, is
  persisted to `localStorage`, and is switched via `LanguageSwitcher.vue`.
- Formatting is locale-aware through `Intl` in `src/utils/format.ts`: numbers
  (`Intl.NumberFormat`), relative times (`Intl.RelativeTimeFormat`), and absolute
  dates (`Intl.DateTimeFormat`). Components pass the current locale into these.

## Progressive Web App

- `vite-plugin-pwa` (`registerType: 'autoUpdate'`) precaches the built app shell
  for offline load and makes the app installable.
- Firebase endpoints (Firestore / Auth / token refresh) are **never cached** —
  they are cross-origin and excluded, so live data and auth always go to network.

## Security model

- Firestore rules (`firestore.rules`) grant **read to any signed-in user** on
  `devices`, `readings`, and `alerts`, and **deny client writes** to them. The
  internal `alertState` pointers are denied entirely by the default-deny rule.
- The only client-writable data is `/users/{uid}/…`, guarded by an
  **owner-scoped** rule (`request.auth.uid == userId`).
- All telemetry/alert writes come from the seeder or Cloud Functions via the
  Admin SDK (bypasses rules). The public demo is tamper-proof: visitors view live
  data and manage their own preferences, but cannot alter the fleet.
- The Firebase **web config** is public by design and shipped in the bundle; the
  **service-account key** is a secret, gitignored, never committed or shipped.
- Auth is email/password; a pre-created demo account powers one-click Demo login.

## Deployment

- **Blaze** plan (required for Cloud Functions). Project `telemetry-monitor-ecfc7`.
- **Hosting (two sites):** `telemetry-monitor-demo` serves the app
  (https://telemetry-monitor-demo.web.app); `telemetry-monitor-ecfc7` is a 301
  redirect to it.
- **Functions:** `generateTelemetry` (scheduled) + `onReadingCreated` (Firestore
  trigger), both in `europe-west1` (co-located with the `eur3` database).
- Deploy with the project commands `/deploy-web` and `/deploy-backend` (they bake
  in Node 24, the mandatory personal `--account`, the quality gate, and known
  first-deploy retries). Deploys are always manual, never on push.
- **CI** (`.github/workflows/ci.yml`) runs the app gate (lint → typecheck → test
  → build) and a separate functions job (lint → build → test) on every push/PR.

## Project structure

```
src/
  services/      Firebase init + data-access (device, alert, analytics, user, auth)
  stores/        Pinia stores (auth, devices, alerts, user)
  views/         Route screens (Login, Overview, Dashboard, DeviceDetail, Alerts, Settings)
  components/    DeviceCard, StatusChip, SeverityChip, TelemetryChart, StatusDonut,
                 KpiTile, NotificationBell, AnimatedNumber, LanguageSwitcher
  composables/   useAppTheme, useDeviceFilters, useAnimatedNumber
  plugins/       Vuetify + theme tokens
  i18n/          vue-i18n config + locales/{en,de,fr,pl,it,es}.ts
  utils/         Pure helpers (format, csv)
  types/         Shared domain types (Device, Reading, Alert, FleetStats, …)
  test/          Test setup + component mount helper
functions/       Cloud Functions v2 — src/lib holds the pure (unit-tested) logic
seeder/          Standalone Admin-SDK telemetry generator (local dev)
redirect-site/   Minimal static site for the old URL's 301 redirect
.claude/commands/ /deploy-web and /deploy-backend project commands
firestore.rules  Client read-only for fleet data; owner-scoped /users/{uid}
```

## Conventions

- **Data access is isolated in `src/services/`** — UI and stores never touch the
  Firebase SDK directly, keeping components testable and the data layer swappable.
- **No inline hex colors** — theme tokens live in `src/plugins/theme.ts`.
- **All user-visible text is i18n-keyed**; formatting is locale-aware.
- **Animated numbers** honor `prefers-reduced-motion` and snap on first paint.
- **Docs and tests are updated with every change** — a change with stale docs or
  missing coverage is incomplete.
- **Pure logic and stores are unit-tested**; components/views use
  `@vue/test-utils` + happy-dom; the functions' alert logic is tested in isolation.
