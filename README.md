# Telemetry Monitor — real-time device dashboard

[![CI](https://github.com/taimoorbinkhalid/realtime-telemetry-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/taimoorbinkhalid/realtime-telemetry-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A small but production-shaped **real-time monitoring dashboard**: a grid of
device cards showing live temperature, humidity, and status that update with no
page refresh, plus a per-device history chart. Built as a portfolio demo with
100% generated data (no real systems, no confidential data).

**Live demo:** https://telemetry-monitor-demo.web.app · one-click **Demo login**,
no sign-up needed.

## Stack

- **Vue 3** (Composition API + `<script setup>`) + **TypeScript**
- **Vuetify 4** for UI, with centralized light/dark theme tokens
- **Firebase**: Auth (email/password), Firestore (`onSnapshot` real-time), Hosting
- **Cloud Functions (v2)**: a scheduled telemetry generator and a
  Firestore-triggered alert engine (see [Backend](#backend-cloud-functions))
- **Pinia** for state, **Vue Router** with an auth guard
- **Chart.js** (via `vue-chartjs`) for the history + status charts
- **vue-i18n** for keyed UI text, and an installable **PWA** (offline app shell)

## Features

- **Fleet overview** landing page: KPI tiles + a status-distribution donut,
  powered by Firestore server-side aggregation queries (`count()` / `average()`),
  with values that animate as data streams in.
- **Live device grid** with search, status/favorites filters, sort, and CSV export.
- **Device detail** with a selectable 1h / 6h / 24h history chart.
- **Alerts**: thresholds evaluated server-side; a live alert feed with
  acknowledge, plus per-device indicators and a notification badge.
- **Per-user data** (favorites, acknowledgements, preferences) under
  owner-scoped security rules.
- **6 languages** (en, de, fr, pl, it, es) with a language switcher and
  locale-aware number / date / relative-time formatting.

## Architecture notes

- Firestore access is isolated in `src/services/` (repository modules). UI
  components and stores never call the Firebase SDK directly.
- `src/plugins/theme.ts` is the single source of color tokens (no inline hex).
- Firestore security rules: `devices`/`readings`/`alerts` are **read-only for
  clients** (written by the seeder or Cloud Functions via the Admin SDK); only
  `/users/{uid}/…` is client-writable, and only by its owner.

See [`docs/architecture.md`](docs/architecture.md) for the full data model, data
flow, and security model.

## Getting started

Requires **Node 20.19+** (the repo pins **Node 24 LTS** via `.nvmrc`; run `nvm use`).

```bash
npm install
cp .env.example .env      # then fill in your Firebase web config
npm run dev
```

### Firebase setup

1. Create a Firebase project (personal account) and a **Web app**; copy the
   config values into `.env` (see `.env.example`).
2. Enable **Authentication → Email/Password**, and create one user for the
   one-click demo login (mirror its email/password into `.env`).
3. Deploy rules + indexes: `firebase deploy --only firestore:rules,firestore:indexes`.
4. Seed live data locally: see [`seeder/README.md`](seeder/README.md), then `npm run seed`.
   In production the scheduled Cloud Function generates telemetry instead (below).

### Backend (Cloud Functions)

The [`functions/`](functions/) package (Cloud Functions v2, its own Node 22
runtime) contains:

- **`generateTelemetry`** — a scheduled function that streams telemetry
  server-side, so the deployed demo stays live without the local seeder.
- **`onReadingCreated`** — a Firestore trigger that evaluates each reading
  against the device's thresholds and maintains the `alerts` collection with
  stateful open/resolve semantics.

Cloud Functions require the Firebase **Blaze** plan. Deploy the backend:

```bash
firebase deploy --only functions,firestore:rules,firestore:indexes
```

### Build & deploy (frontend)

```bash
npm run build
firebase deploy --only hosting
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run typecheck` | Type-check only |
| `npm run lint` | Lint `.vue` / `.ts` |
| `npm test` | Run unit tests (Vitest, watch mode) |
| `npm run test:run` | Run unit tests once (used by CI) |
| `npm run seed` | Stream fake telemetry into Firestore (local dev) |

The `functions/` package has its own scripts (`npm --prefix functions run build`
/ `lint` / `test:run`).

## Testing & CI

Unit tests (Vitest) cover the pure formatters, CSV export, the filter/sort and
easing composables, the Pinia stores (with the data layer mocked), and the pure
alert-evaluation logic in `functions/`. Every push and PR runs, via
[GitHub Actions](.github/workflows/ci.yml), the app gate (lint → typecheck →
test → build) and a separate functions job (lint → build → test).

## Contributing & license

Development workflow, commit conventions, and deploy steps are in
[CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).
