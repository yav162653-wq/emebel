# eMebel

eMebel is a full-stack furniture commerce application built with React, Express, PostgreSQL, and Prisma.

## Technology

- React 18, Vite, Wouter, TanStack Query, Zustand
- Express 5 and TypeScript
- PostgreSQL, Prisma 7, `express-session`
- Shopify Storefront/Admin APIs
- Resend email and optional Google, GitHub, and Telegram authentication
- Pino and optional OpenTelemetry

## Prerequisites

- Node.js 20 LTS or newer
- npm
- PostgreSQL 14 or newer

## Installation

```powershell
cd C:\path\to\eMebel
npm install
Copy-Item .env.example .env
```

Set at least `DATABASE_URL` and `SESSION_SECRET` in `.env`. Generate a strong session secret before running production.

## Database

```powershell
npm run db:migrate
```

`npm run db:migrate` applies the versioned migrations in `prisma/migrations`.
Use `npm run db:push` only for local schema prototyping; do not use it for deployments.

For an explicitly opted-in local development seed:

```powershell
$env:SEED_DEMO_DATA="true"
npm run db:seed
```

Production seeding is rejected regardless of this setting. The seed creates catalog
data and does not create fixed demo users or passwords.

## Development

```powershell
npm run dev
```

The application is served at `http://localhost:5000` by default.

## Checks and Build

```powershell
npm run check
npm test
npm run test:client
npm run build
npm start
```

`npm start` runs the production build and requires `NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET`, and `APP_ORIGIN`.

## Database Integration Tests

```powershell
npm run test:db-integration
```

This command requires Docker Compose. It starts a uniquely named PostgreSQL 16
container on `127.0.0.1:55437` with temporary storage, applies and checks Prisma
migrations, runs cart/order concurrency tests, and removes the container in a
`finally` block. The test code rejects database URLs other than the local
`emebel_test` target; the command does not use `.env` database URLs.

The browser authentication flows (registration, login, logout, and protected
route redirects) are exercised by `npm run test:e2e`. Run those only with a
disposable test database configured; the development server uses `DATABASE_URL`.

## Environment

Copy `.env.example` to `.env`. Required variables:

- `DATABASE_URL`
- `SESSION_SECRET` (16 characters minimum)
- `NODE_ENV`
- `APP_ORIGIN` in production

Optional integration variables are documented in `.env.example`.

## Shopify

Set `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, and `SHOPIFY_ADMIN_ACCESS_TOKEN` for catalog/checkout integrations.

The optional sync script uses Shopify credentials and the local database:

```powershell
npx tsx script/sync-shopify-catalog.ts
```

Admin catalog reads and Shopify-idempotent mutations have a bounded retry
policy. Storefront checkout retries reads only; cart creation is not replayed
after a timeout because its outcome may be unknown.

## Security

Never commit `.env`, credentials, or API keys. Demo accounts use predictable passwords and must not be enabled in production.

## Documentation

- Initial architecture/security audit: [docs/audit/INITIAL_AUDIT.md](docs/audit/INITIAL_AUDIT.md)
- Final cleanup report: [docs/audit/FINAL_CLEANUP_REPORT.md](docs/audit/FINAL_CLEANUP_REPORT.md)
- Phase 2 verification report: [docs/audit/PHASE_2_VERIFICATION_REPORT.md](docs/audit/PHASE_2_VERIFICATION_REPORT.md)
- Environment audit: [docs/local-development/ENVIRONMENT_AUDIT.md](docs/local-development/ENVIRONMENT_AUDIT.md)
- Local setup guide: [docs/local-development/LOCAL_SETUP.md](docs/local-development/LOCAL_SETUP.md)
- Local startup report: [docs/local-development/LOCAL_STARTUP_REPORT.md](docs/local-development/LOCAL_STARTUP_REPORT.md)
