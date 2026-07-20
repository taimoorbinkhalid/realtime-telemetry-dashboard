---
description: Build and deploy the frontend to Firebase Hosting (personal account).
---

Deploy the Vue app to Firebase Hosting for this project. Follow these steps
exactly and stop if any check fails.

1. Use the pinned Node version: `nvm use` (Node 24 via `.nvmrc`).
2. Confirm the git identity is personal, never the work account:
   `git config user.email` must be `taimoorkhalid95@gmail.com`.
3. Run the quality gate first: `npm run lint && npm run typecheck && npm run test:run`.
4. Build: `npm run build`.
5. Deploy hosting, forcing the personal Firebase account (the CLI default is the
   work account, which must never be used here):

   ```
   npx firebase-tools deploy --only hosting \
     --project telemetry-monitor-ecfc7 \
     --account taimoorkhalid95@gmail.com
   ```

6. Report the printed Hosting URL (site: `telemetry-monitor-demo.web.app`).

Notes:
- The `--account` flag is mandatory: see the workspace work/personal separation rules.
- Hosting only. For functions/rules/indexes use `/deploy-backend`.
