# Phase 5.1 Demo Credential and Seed Security Report

## Files Changed

- `server/db/seed-policy.ts`
- `server/db/seed-policy.test.ts`
- `server/db/seed.ts`
- `server/config/env.ts`
- `client/src/pages/Auth/Login.tsx`
- `client/src/pages/Admin/AdminDashboard.tsx`
- `client/src/locales/en.ts`
- `client/src/locales/ru.ts`
- `client/src/locales/uz.ts`
- `.env.example`
- `package.json`
- `README.md`
- `docs/local-development/LOCAL_SETUP.md`
- `docs/audit/PHASE_5_1_DEMO_SECURITY_REPORT.md`

No Prisma schema or migration files were changed.

## Before and After

Before remediation:

- The seed created fixed `nasa_admin` and `user` accounts with a fixed password.
- Login and admin UI exposed or referenced those demo credentials.
- The seed had no environment or opt-in guard.

After remediation:

- The seed creates catalog data only.
- The seed first checks `NODE_ENV`, `SEED_DEMO_DATA`, and database host locality.
- Production seed execution is rejected regardless of opt-in.
- Development and test seed execution is disabled unless explicitly opted in.
- Demo database seeding is restricted to localhost, loopback, or IPv6 loopback URLs.
- The login UI contains no fixed credential controls.
- The demo UI indicator is enabled only for development builds with `VITE_ENABLE_DEMO_DATA=true`.
- Production builds default to no demo UI and no fixed demo account names.

## Tests

The seed-policy suite verifies:

- Production is always rejected.
- Development is disabled by default.
- Development requires explicit opt-in.
- Test requires opt-in and a local database.
- Remote databases are rejected.
- Seed mutation actions are not called before policy validation succeeds.

The existing authentication suite remains included in `npm test`.

Final verification results:

- `npm run check`: passed.
- `npm test`: passed 26/26.
- `npm run test:seed-security`: passed 6/6.
- `npm run build`: passed.
- Production seed with `NODE_ENV=production` and explicit opt-in: rejected.
- Development seed with explicit opt-in against the already seeded local database:
  policy allowed and reported that 24 products were already present.
- Development seed without opt-in: rejected.

## Production Bundle Inspection

The rebuilt `dist` was searched for:

- `nasa_admin`
- `Demo Credentials`
- `Development demo mode enabled`
- the fixed credential pair text

All four searches returned `Found: false`.

## Production Bundle Inspection

The production bundle must be inspected with fixed demo account and demo credential
labels as search needles. No fixed demo account name or credential control may
appear in `dist`.

## Existing Database Handling

No existing database was modified by this remediation. Existing demo accounts,
if present from the old seed, remain unchanged. They require an explicit,
authorized operator decision to rotate, disable, or delete.

## Remaining Risks

- Development seed opt-in is still a local operator-controlled setting.
- Existing databases that already contain the old demo accounts remain vulnerable
  until the owner performs the approved remediation procedure.
- Production startup environment validation prevents contradictory
  `production` plus `SEED_DEMO_DATA=true` configuration.
