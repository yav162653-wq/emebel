# eMebel Initial Audit

## Status

This audit was completed before the cleanup edits. The application is a full-stack TypeScript project.

## Current Architecture

- Frontend: React 18, Vite, Wouter, TanStack Query, Zustand, Tailwind CSS, Radix UI.
- Backend: Express 5 running on Node.js with TypeScript.
- Database: PostgreSQL through Prisma 7 and the `pg` adapter.
- Sessions: PostgreSQL-backed `express-session` using `connect-pg-simple`.
- Authentication: bcrypt local identities, JWT utilities, session cookies, magic-link tokens, and optional Google, GitHub, and Telegram providers.
- Integrations: Shopify Storefront/Admin APIs and Resend email delivery.
- Observability: Pino logging and optional OpenTelemetry tracing.

## Folder Structure

- `client/` — Vite/React application.
- `server/` — Express API, domain modules, database, and middleware.
- `shared/` — Shared application types.
- `prisma/` — Prisma schema.
- `script/` — Database and Shopify maintenance scripts.
- `packages/` and `lib/` — Supporting source modules.
- `attached_assets/` — referenced asset path for Vite; verify whether populated in the source archive.

## Replit Dependencies Found

- Vite runtime-error, cartographer, and dev-banner plugins.
- `@replit/connectors-sdk`.
- Replit connector environment variables and proxy authentication.
- Replit-specific proxy comments and URL assumptions.
- Replit publication fallback naming in the Shopify catalog sync.
- Replit package registry URLs in `package-lock.json`.
- Committed `node_modules` and generated files were present; they must not be committed.

## External Service Dependencies

- PostgreSQL is required for application data and sessions.
- Shopify is optional for storefront/catalog features but requires direct credentials.
- Resend is optional for authentication email.
- OAuth providers are optional and only enabled when configured.
- OpenTelemetry is optional.

## Security Findings

- No `.gitignore` was present in the audited project.
- Demo credentials use predictable values and must not be used in production.
- Secret values must remain in environment variables and outside version control.
- `package-lock.json` contains environment-specific package-firewall URLs and should be regenerated.
- No license was selected by the owner; no license file is being created.
- Git history was not available for secret scanning in this directory.

## Risks

- Database schema and application startup require a valid `DATABASE_URL`.
- Removing Replit connectors requires direct Shopify and Resend credentials.
- Prisma 7 configuration and native binaries depend on a supported Node.js runtime.
- Demo seed behavior can create known credentials.
- Production proxy and CORS settings require explicit configuration.

## Recommended Cleanup Actions

1. Remove Replit Vite plugins and dependencies.
2. Replace Replit Shopify and Resend connector calls with direct provider APIs.
3. Add standard `.env` loading and validation.
4. Add ignore rules and exclude dependency/build directories.
5. Rename package metadata and stale defaults to eMebel.
6. Add local setup documentation and CI that does not require external secrets.
7. Run installation, type-check, tests, and build checks.
