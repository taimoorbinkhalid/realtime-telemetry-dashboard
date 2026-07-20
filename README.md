# Telemetry Monitor — real-time device dashboard

[![CI](https://github.com/taimoorbinkhalid/realtime-telemetry-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/taimoorbinkhalid/realtime-telemetry-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A small but production-shaped **real-time monitoring dashboard**: a grid of
device cards showing live temperature, humidity, and status that update with no
page refresh, plus a per-device history chart. Built as a portfolio demo with
100% generated data (no real systems, no confidential data).

**Live demo:** _(add your Firebase Hosting URL here)_ · one-click **Demo login**,
no sign-up needed.

## Stack

- **Vue 3** (Composition API + `<script setup>`) + **TypeScript**
- **Vuetify 4** for UI, with centralized light/dark theme tokens
- **Firebase**: Auth (email/password), Firestore (`onSnapshot` real-time), Hosting
- **Pinia** for state, **Vue Router** with an auth guard
- **Chart.js** (via `vue-chartjs`) for the history chart
- **vue-i18n** — all UI text is keyed

## Architecture notes

- Firestore access is isolated in `src/services/` (repository modules). UI
  components and stores never call the Firebase SDK directly.
- `src/plugins/theme.ts` is the single source of color tokens (no inline hex).
- Firestore security rules (`firestore.rules`) are **read-only for clients**;
  all writes come from the trusted seeder (Admin SDK).

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
3. Deploy the security rules: `firebase deploy --only firestore:rules`.
4. Seed live data: see [`seeder/README.md`](seeder/README.md), then `npm run seed`.

### Build & deploy

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
| `npm run seed` | Stream fake telemetry into Firestore |

## Testing & CI

Unit tests (Vitest) cover the pure formatters and the Pinia stores (with the
data layer mocked). Every push and PR runs lint → typecheck → test → build via
[GitHub Actions](.github/workflows/ci.yml).

## Contributing & license

Development workflow, commit conventions, and deploy steps are in
[CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).
