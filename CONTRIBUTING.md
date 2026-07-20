# Contributing / development workflow

This is a solo portfolio project, but it follows the same conventions I use on
production teams. If you're browsing it as a reviewer, this is how it's built
and maintained.

## Prerequisites

- **Node 20.19+** (the repo pins Node 24 via `.nvmrc` — run `nvm use`)
- A Firebase project (personal), configured per the [README](README.md)

## Getting set up

```bash
nvm use              # switch to the pinned Node version
npm install
cp .env.example .env # fill in your Firebase web config
npm run dev
```

## Git workflow

- **`main`** is always green (CI passes) and deployable.
- Do non-trivial work on a branch, then open a PR into `main`:

  ```bash
  git switch -c feat/history-zoom
  # ...commit as you go...
  git push -u origin feat/history-zoom
  ```

- **Conventional commit prefixes:** `feat:`, `fix:`, `refactor:`, `docs:`,
  `test:`, `chore:`, `style:`, `build:`. Keep subjects imperative and concise.
- Rebase/tidy before merging; prefer a clean, readable history.

## Quality gates (run before pushing)

CI runs all four on every push and PR, so run them locally first:

```bash
npm run lint        # ESLint, zero warnings allowed
npm run typecheck   # vue-tsc, no emit
npm run test:run    # Vitest, single run
npm run build       # type-check + production build
```

## Testing

- Tests live next to the code as `*.spec.ts` and run on **Vitest** (co-located,
  not a separate `tests/` tree).
- Scope:
  - **Pure logic** (`src/utils/`) and **composables** (filters, easing).
  - **Pinia stores**, with the service layer mocked (`vi.mock('@/services/…')`)
    so tests never hit Firebase.
  - **Components / views** via `@vue/test-utils` + happy-dom (opt in per file
    with `// @vitest-environment happy-dom`; mount through `src/test/mount.ts`).
  - **Cloud Functions** pure logic (`functions/src/lib/*.spec.ts`).
- `npm test` is watch mode; `npm run test:run` is the one-shot CI run. The
  functions package has its own `npm --prefix functions run test:run`.
- Don't test framework glue or exact markup; do test behavior and derivations.

## Documentation & tests are part of every change

Treat stale docs or missing tests as an **incomplete change**, not a follow-up.
Every feature or behavior change ships with:

- Updated [README.md](README.md) (setup/usage/features) and
  [docs/architecture.md](docs/architecture.md) (stack, data model, flow, security,
  i18n, PWA, deployment) when any of those move.
- Updated JSDoc on exported functions / non-trivial logic.
- New or updated `*.spec.ts` covering the new behavior.

The seeder and functions have their own READMEs/JSDoc; keep them current too.

## Deploying

Deploys are **manual and deliberate** (never automatic on push) and must use the
personal Firebase account. Use the project commands, which encode the correct
account, targets, and gotchas:

- **Frontend:** `/deploy-web` → builds and deploys hosting to the
  `telemetry-monitor-demo` site.
- **Backend:** `/deploy-backend` → deploys Cloud Functions + Firestore rules +
  indexes (requires the Blaze plan).

Equivalent raw commands (note the mandatory `--account`):

```bash
npx firebase-tools deploy --only hosting \
  --project telemetry-monitor-ecfc7 --account taimoorkhalid95@gmail.com
npx firebase-tools deploy --only functions,firestore:rules,firestore:indexes \
  --project telemetry-monitor-ecfc7 --account taimoorkhalid95@gmail.com
```

The old `telemetry-monitor-ecfc7.web.app` site is a 301 redirect to the demo
site. The Firestore emulator (for local backend testing) needs **JDK 21+**.

## Never commit secrets

`.env`, `serviceAccountKey.json`, and any `*-service-account*.json` are
gitignored. The Firebase **web** config is public by design; the
**service-account** key is not and must never be committed or shipped to the client.
