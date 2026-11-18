# eMebel Local Startup Report

## A. Machine Environment

- Windows 11 Pro 64-bit.
- Node.js v22.15.0.
- npm 11.5.2.
- Git 2.51.0.windows.2.
- PostgreSQL 17 service is running automatically.
- PostgreSQL client binaries exist but `psql` was not on `PATH`.
- Available disk space is sufficient.

## B. Project Architecture

- The frontend is React/Vite.
- The backend is Express/TypeScript.
- Development runs in one process through `npm run dev`.
- Express mounts Vite middleware and serves same-origin `/api` routes.
- PostgreSQL stores application data and sessions.
- Prisma 7 uses `@prisma/adapter-pg`.
- The default local port is 5000.
- Production static files are served from `dist/public` after `npm run build`.

## C. Dependency Status

PASSED: `npm ci` installed 822 packages from the existing lockfile.

PASSED: Prisma schema validation passed.

PASSED: Prisma Client generation passed.

PASSED: `npm run check` passed after the clean install.

PASSED: `npm test` passed 19/19 tests.

PASSED: `npm run build` passed.

Known dependency issue: npm reports 23 remaining vulnerabilities. No automatic upgrade was performed.

## D. Environment Variables

The following local variables were established:

- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV`
- `PORT`
- `APP_ORIGIN`

The local `.env` is untracked and contains no real external credentials.

Optional Shopify, Resend, OAuth, and telemetry variables remain blank or absent.

## E. Database

PASSED:

- PostgreSQL 17 is running.
- A local TCP connection to PostgreSQL succeeded.
- The separate `emebel_dev` database was created.
- A random local database role password was configured.
- Prisma created and applied the initial migration `20261118144134_init`.
- `npx prisma migrate status` reports the schema as up to date.
- The local database was seeded with 24 products and demo accounts.

NOT APPLICABLE:

- No existing production or remote database was modified.
- No reset, force-reset, drop, or destructive SQL was executed.

## F. Application Startup

Development startup:

```powershell
npm run dev
```

PASSED:

- Server remained running.
- Health endpoint responded on port 5000.
- `/api/products` returned 24 seeded products.
- Vite frontend HTML and `/src/main.tsx` responded.
- Browser loaded the homepage and authenticated shop.

Production artifact startup:

```powershell
npm run build
npm start
```

PASSED after externalizing `pg` from the production bundle:

- `npm start` logs `[production]`.
- `/api/health` returns `status: ok`.
- `/api/products` returns 24 products.
- `/` serves the production static homepage.

## G. Browser Verification

PASSED:

- Homepage loaded with seeded product cards.
- Shop page loaded for an authenticated session.
- Demo user login succeeded.
- Login redirected to `/shop`.
- Account page displayed the authenticated user.
- Logout succeeded and redirected to login.
- Registration created a new local smoke-test account and redirected to `/shop`.

Observed browser limitation:

- An Unsplash-hosted image was blocked by browser ORB (`ERR_BLOCKED_BY_ORB`) on an external image request.
- This is an external asset/network limitation, not a backend startup failure.

## H. Functionality Tests

| Area | Status |
|---|---|
| Frontend homepage | VERIFIED |
| Product listing | VERIFIED |
| Navigation | VERIFIED |
| Local registration | VERIFIED |
| Local password login | VERIFIED |
| Session handling | VERIFIED |
| Logout | VERIFIED |
| Database connectivity | VERIFIED |
| API health | VERIFIED |
| Magic-link unit behavior | PARTIALLY VERIFIED |
| Email provider | NOT VERIFIED with live Resend |
| OAuth providers | NOT VERIFIED with live credentials |
| Shopify storefront | NOT VERIFIED |
| Shopify Admin/catalog sync | NOT VERIFIED |
| Password reset | NOT VERIFIED / feature not found |

## I. Changes Applied

Created:

- `.env`
- `prisma/migrations/20261118144134_init/migration.sql`
- `docs/local-development/ENVIRONMENT_AUDIT.md`
- `docs/local-development/LOCAL_SETUP.md`
- `docs/local-development/LOCAL_STARTUP_REPORT.md`

Modified:

- `package.json`
- `script/build.ts`
- `prisma.config.ts`
- `server/config/env.ts`
- `server/db/client.ts`
- `server/modules/identity/infrastructure/prisma-identity.repository.ts`

Database change:

- Created separate local database `emebel_dev`.
- Applied initial migration.
- Seeded local demo products and accounts.

No remote database or external provider was modified.

## J. Remaining Blockers

- Live Resend credentials are needed for email delivery.
- Live OAuth credentials are needed for provider callbacks.
- Live or sandbox Shopify credentials are needed for catalog and checkout verification.
- Demo credentials should not be used outside isolated local development.
- GitHub remotes and CI owner actions remain outstanding.

## K. Next Engineering Recommendations

1. Remove demo credentials and demo credential hints from production builds.
2. Replace Replit remotes with the intended GitHub remote.
3. Add CI execution and verify migrations in PostgreSQL.
4. Add an explicit seed guard requiring a development-only environment.
5. Decide whether password-reset and separate email-verification workflows are required.
6. Replace externally hosted Unsplash assets with locally controlled assets or a reliable CDN strategy.
7. Plan a dependency update for known npm audit findings after compatibility testing.

## L. Final Status

**LOCAL ENVIRONMENT READY WITH LIMITATIONS**

The application starts locally in development and production modes, connects to PostgreSQL, serves the frontend, and passes the available local smoke tests. Live email, OAuth, Shopify, and CI verification remain blocked by credentials and external infrastructure.
