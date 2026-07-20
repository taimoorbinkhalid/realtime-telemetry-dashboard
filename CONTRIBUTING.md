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

- Tests live next to the code as `*.spec.ts` and run on **Vitest**.
- Scope: **pure logic** (`src/utils/`) and **Pinia stores** (with the service
  layer mocked). Data-access modules are kept thin so the app is testable
  without hitting Firebase.
- `npm test` runs Vitest in watch mode during development; `npm run test:run`
  is the one-shot run used by CI.
- Add a test with any behavior change: a new formatter, a new store action, a
  new derivation. Don't test framework glue or presentational markup.

## Documentation

- Keep [README.md](README.md) accurate for setup/usage.
- Keep [docs/architecture.md](docs/architecture.md) current when the data model,
  data flow, or security model changes.
- The seeder has its own [seeder/README.md](seeder/README.md).

## Deploying

Deploys are **manual and deliberate** (never automatic on push):

- **Locally:** `npm run build && firebase deploy --only hosting`
- **Via GitHub Actions:** Actions tab → **Deploy to Firebase Hosting** → *Run
  workflow*. This requires the `FIREBASE_SERVICE_ACCOUNT` and `VITE_FIREBASE_*`
  repository secrets (see [.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

Security rules are deployed separately: `firebase deploy --only firestore:rules`.

## Never commit secrets

`.env`, `serviceAccountKey.json`, and any `*-service-account*.json` are
gitignored. The Firebase **web** config is public by design; the
**service-account** key is not and must never be committed or shipped to the client.
