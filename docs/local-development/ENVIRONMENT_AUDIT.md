# eMebel Environment Audit

Audit date: 2026-11-18

## Machine Environment

| Component | Installed value | Status |
|---|---|---|
| Operating system | Microsoft Windows 11 Pro, 64-bit, build 26300 | Compatible |
| Node.js | v22.15.0 | Compatible |
| npm | 11.5.2 | Compatible |
| Git | 2.51.0.windows.2 | Compatible |
| PostgreSQL service | `postgresql-x64-17`, running, automatic startup | Available |
| PostgreSQL 17 client | `C:\Program Files\PostgreSQL\17\bin\psql.exe` | Available but not on `PATH` |
| PostgreSQL 18 installation | Also present | Not used |
| Disk space | C: 35.4 GB free; D: 39.7 GB free | Sufficient |
| Project location | `C:\Users\user\Downloads\eMebel\project` | Accessible |

The project requires Node.js 20.19+ or 22.12+ for current Prisma 7 packages. Node 22.15.0 satisfies this requirement.

## Project Runtime

- Frontend and backend run in one development process.
- `npm run dev` starts Express and mounts Vite middleware on the Express HTTP server.
- The default and verified local port is 5000.
- Frontend requests use same-origin `/api` routes.
- PostgreSQL is required for application data and session storage.
- Prisma uses PostgreSQL through `@prisma/adapter-pg`.
- External credentials are optional for base startup, but required for their corresponding features.

## Environment Configuration

No `.env` existed before Phase 3. A local `.env` was created and is excluded from Git.

Required startup variables:

| Variable | Classification | Verified |
|---|---|---|
| `DATABASE_URL` | Required for DB and startup | Verified with `emebel_dev` |
| `SESSION_SECRET` | Required for sessions | Verified with a local random value |
| `NODE_ENV` | Development/production mode | Verified |
| `PORT` | Optional, defaults to 5000 | Verified |

Production-only:

| Variable | Classification |
|---|---|
| `APP_ORIGIN` | Required by current environment validation |

Optional integrations:

| Variable | Effect |
|---|---|
| `AUTH_EMAIL_FROM` | Enables sender identity for Resend |
| `AUTH_MAGIC_LINK_TTL_MINUTES` | Controls magic-link lifetime |
| `RESEND_API_KEY` | Enables direct Resend email delivery |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Enable Google authentication |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Enable GitHub authentication |
| `TELEGRAM_CLIENT_ID`, `TELEGRAM_CLIENT_SECRET` | Enable Telegram authentication |
| `SHOPIFY_SHOP_DOMAIN` | Enables Shopify direct configuration |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Enables Storefront API and checkout |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Enables catalog synchronization |
| `SHOPIFY_SYNC_NAMES` | Limits optional catalog sync |
| `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_EXPORTER` | Optional telemetry |

## Dependency Status

- Clean `npm ci` installation passed.
- Prisma 7.10.1 and `@prisma/client` 7.10.1 are generated correctly after a clean install.
- 23 npm audit findings remain: 8 moderate and 15 high.
- No broad dependency upgrade was performed.
- No Replit package imports or Replit package-registry references remain outside audit documentation.

## Problems Discovered and Fixed

1. Blank optional `.env` values were rejected by Zod.
2. `server/db/client.ts` did not load `.env` for direct scripts such as seeding.
3. The clean-install environment did not expose Prisma named exports to Node ESM, requiring a require bridge.
4. The `start` script did not force production mode or start the built artifact reliably.
5. The production bundle could not use a bundled `pg` module with the Prisma adapter; `pg` is now externalized.

## Remaining Blockers

- Resend credentials are unavailable.
- Google, GitHub, and Telegram credentials are unavailable.
- Shopify credentials are unavailable.
- CI execution and GitHub publication remain owner actions.
