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
| Data / backend | **Firebase** — Auth, Firestore, Hosting | Real-time reads via `onSnapshot`; no server to run |
| Charts | **Chart.js** via `vue-chartjs` | Simple, dependable history chart |
| i18n | **vue-i18n** | All UI text is keyed, never hardcoded |
| Build / test | **Vite**, **Vitest**, **ESLint** | Fast dev loop; CI-enforced quality gates |

## Data model (Firestore)

```
devices/{deviceId}
  ├─ name: string              # display name
  ├─ location: string          # free-text label
  ├─ status: "online" | "warning" | "offline"   # derived from latest reading
  ├─ temperature: number       # latest sample, °C  (denormalized for the grid)
  ├─ humidity: number          # latest sample, %   (denormalized for the grid)
  ├─ lastReadingAt: number     # epoch millis
  └─ readings/{readingId}      # time-ordered history subcollection
       ├─ temperature: number
       ├─ humidity: number
       └─ recordedAt: number   # epoch millis
```

The latest values are **denormalized** onto each `devices/{id}` document so the
dashboard grid renders from a single collection subscription, without fanning
out a read per device into the `readings` subcollection. The detail view
subscribes to the subcollection only for the device being viewed.

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

1. The **seeder** (`seeder/seed.ts`) uses the Firebase **Admin SDK** to write
   randomized telemetry every few seconds. It runs locally / off-platform and
   bypasses security rules, so it is the only writer.
2. The client subscribes to Firestore through the **service layer**
   (`src/services/`). Nothing else imports the Firestore SDK directly.
3. Services push updates into **Pinia stores**, which own the subscription
   lifecycle (one shared listener, torn down on sign-out).
4. **Components** read reactive store state and re-render on every snapshot: no
   manual refresh, no polling.

## Security model

- Firestore rules (`firestore.rules`) grant **read to any signed-in user** and
  **deny all client writes** (`allow write: if false`). A default-deny rule
  covers everything else.
- All writes therefore come exclusively from the trusted seeder via the Admin
  SDK, which bypasses rules. The public demo is tamper-proof: visitors can view
  live data but cannot modify it.
- The Firebase **web config** (API key, etc.) is public by design and shipped
  in the bundle; it is not a secret. The service-account key **is** a secret and
  is gitignored, never committed, never shipped to the client.
- Auth is email/password. A pre-created demo account powers the one-click
  **Demo login** so visitors need not register.

## Project structure

```
src/
  services/      Firebase init + data-access modules (the only Firestore callers)
  stores/        Pinia stores (auth, devices) — subscription lifecycle + state
  views/         Route-level screens (Login, Dashboard, DeviceDetail)
  components/    Presentational units (DeviceCard, StatusChip, TelemetryChart)
  composables/   Reusable Composition API logic (e.g. theme)
  plugins/       Vuetify + theme token setup
  i18n/          vue-i18n config + locale strings
  utils/         Pure helpers (formatting)
  types/         Shared domain types (Device, Reading, DeviceStatus)
seeder/          Standalone Admin-SDK telemetry generator
firestore.rules  Read-only-for-clients security rules
```

## Conventions

- **Data access is isolated in `src/services/`** — UI and stores never touch the
  Firebase SDK directly, which keeps components testable and the data layer swappable.
- **No inline hex colors** — theme tokens live in `src/plugins/theme.ts`.
- **All user-visible text is i18n-keyed.**
- **Pure logic is unit-tested** (see `src/**/*.spec.ts`); stores are tested with
  the service layer mocked.
