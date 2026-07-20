---
description: Deploy Cloud Functions + Firestore rules & indexes (personal account, Blaze).
---

Deploy the backend for this project: Cloud Functions, Firestore security rules,
and indexes. Requires the Blaze plan (already enabled). Follow exactly.

1. `nvm use` (Node 24). Note: the functions runtime is Node 22, but tooling runs
   on Node 24 fine.
2. Confirm personal identity: `git config user.email` == `taimoorkhalid95@gmail.com`.
3. Verify the functions package first: `npm --prefix functions run lint && npm --prefix functions run build && npm --prefix functions run test:run`.
4. Deploy, forcing the personal Firebase account:

   ```
   npx firebase-tools deploy --only functions,firestore:rules,firestore:indexes \
     --project telemetry-monitor-ecfc7 \
     --account taimoorkhalid95@gmail.com
   ```

Notes & gotchas:
- `--account taimoorkhalid95@gmail.com` is mandatory (never the work account).
- First-time / cold deploys of the Firestore-triggered function may fail with an
  Eventarc "Service Agent permissions still propagating" error or a transient
  409 on the `gcf-v2-sources` bucket. This is expected: wait ~2 minutes and
  re-run the same command (idempotent). Retry up to ~3 times.
- Composite indexes build asynchronously; the alerts view may show a transient
  index error until they are READY.
- Do NOT run the local seeder against production while `generateTelemetry` is
  deployed (double-writes). The seeder is for the emulator / dev only.
