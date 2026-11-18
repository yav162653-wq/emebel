# eMebel Enterprise Architecture and Engineering Quality Audit

Audit date: 2026-11-18

## Executive Summary

eMebel has a practical modular full-stack architecture and passed local startup, type checking, build, migration status, and unit tests. The application is beyond a prototype but is not yet enterprise-ready. Main risks are unsafe demo credentials, use of the PostgreSQL superuser, weak API contracts, incomplete transaction boundaries for orders/cart operations, broad CORS/proxy configuration choices, production data-seeding behavior, and missing frontend/database integration coverage.

The architecture is more mature than a generated monolith: domain/application/infrastructure concepts exist for identity, routes are separated by module, configuration is Zod-validated, sessions are PostgreSQL-backed, and external Shopify/Resend adapters replace Replit connectors. However, Phase 3 compatibility fixes introduced a maintainability seam (`createRequire(process.cwd() + "/package.json")`) and should be replaced with a generated Prisma client import strategy once the package/runtime model is verified.

## Architecture Overview

- React 18 and Vite frontend.
- Express 5 backend with request-ID, Pino logging, Helmet, CORS, rate limiting, and PostgreSQL-backed sessions.
- Prisma 7 PostgreSQL ORM using `@prisma/adapter-pg`.
- Domain/application/infrastructure organization for identity.
- Router/service/repository patterns for commerce modules.
- Shopify Storefront and Admin integrations.
- Direct Resend integration behind `EmailSender`.
- Local unit tests for identity and OAuth behavior.

The system is a well-shaped modular monolith. This is preferable to microservices or distributed infrastructure for the current scale.

## Hardcoding Findings

| Severity | File | Finding |
|---|---|---|
| Critical | `server/db/seed.ts:19-34` | Seed hashes and exposes predictable `nasa_admin` / `user` credentials with password `password`. UI also exposes these credentials. |
| High | `server/db/seed.ts:64-254` | 24 seeded products, prices, stock, image URLs, and product metadata are embedded in source. Development seeding is legitimate demo data, but execution has no environment guard. |
| High | `server/modules/shopify/shopify.service.ts:100-116` | Shopify checkout hardcodes USD and compares integer local cents exactly against Shopify variant amounts. This is a legitimate business rule only if USD is intentionally the sole supported currency. |
| Medium | `server/modules/orders/orders.service.ts:17` | New orders always use status `Processing`; this is a valid initial-state default, but status constants should be centralized and typed. |
| Medium | `server/modules/admin/admin.service.ts:3` | Order status values are a local string union plus a runtime `as any` check. |
| Medium | `server/middleware/rateLimiter.ts:15-61` | Limits and windows are application defaults. Centralizing environment-overridable defaults would improve operations, but literals are acceptable initially. |
| Medium | `server/app.ts:45-53` | CSP hosts include Unsplash and Google Fonts. These are legitimate external dependencies but should be centralized and configurable. |
| Medium | `.env.example:4-6` | Placeholder values are safe. Example database URL is clearly non-production. |
| Low | `server/config/env.ts:9-13` | Test-only database and session defaults are hidden behind test detection. This is isolated test behavior, not production credentials, but test detection should be explicit. |

## Unsafe Any Findings

Production-owned explicit unsafe `any` or equivalent broad typing found:

| File | Evidence |
|---|---|
| `shared/routes.ts:72,77,84,90` | Four `z.any()` response schemas. |
| `server/db/client.ts:35,39,43` | Three Prisma event callbacks typed with `any`. |
| `client/src/app/providers/AuthProvider.tsx:10,12` | Login and register payloads typed as `any`. |
| `client/src/pages/Landing/LandingPage.tsx:95` | Subscription error is typed as `any`. |
| `server/modules/admin/admin.service.ts:58` | Status validation uses `status as any`. |

Other unsafe patterns:

- `server/utils/jwt.ts:25` uses `jwt.verify(...) as JwtPayload` instead of runtime validation.
- `server/db/client.ts:34-44` uses `as never` in addition to `any` event callbacks.
- `orders.router.ts:41` and service code use non-null assertions for session IDs and map lookups. These are defensible after middleware/validation but still deserve domain guards.

No unsafe Prisma generated files were counted.

Recommended enforcement:

- ESLint `@typescript-eslint/no-explicit-any: error`.
- `noUnsafeAssignment`, `noUnsafeArgument`, `noUnsafeCall`, `noUnsafeMemberAccess`, `noUnsafeReturn`.
- Keep `unknown` at external boundaries.
- Replace response `z.any()` with `z.array(ProductSchema)`, `z.array(CartItemSchema)`, and explicit response schemas.
- Add Zod validation to JWT payloads and external API JSON.
- Define `OrderStatus` and `UserRole` unions centrally.

## Mock Data Findings

- The seed system is legitimate development/demo data but is currently not environment-gated.
- 24 products in `server/db/seed.ts` are real database seed fixtures.
- Demo users and fixed passwords are dangerous if seed execution reaches production.
- UI text and demo credential buttons are development/demo features that should be compile-time or environment-gated out of production.
- Unit tests contain legitimate isolated fixtures and mock providers.
- No identified fake payment implementation or fake checkout success exists; Shopify remains a real external integration.

The seed and demo UI must be separated into an explicit development seed, with a hard production guard.

## Modularity Findings

Positive:

- Identity correctly separates domain, application, infrastructure, and presentation.
- Commerce services isolate database operations.
- Middleware and shared utilities are clearly separated.
- External integration interfaces exist for email and OAuth.

Weaknesses:

- Some routers directly access Prisma, such as `orders.router.ts:33`, instead of routing all persistence through a service.
- Cart merge logic performs find/create/update race-prone operations outside a transaction.
- Wishlist synchronization is looped upserts rather than a bulk transactional operation.
- Order creation is not itself a transaction between stock verification and order/cart deletion.
- The shared route specification is not strongly typed for all endpoints and contains `any` schemas.
- `JwtUtil` is unused future infrastructure, adding minor complexity and reusing session secret semantics.

## Portability Findings

- Runtime source is platform-neutral.
- Documentation and seed paths contain Windows examples, but these are documentation, not runtime assumptions.
- `vite.config.mts` uses `process.cwd()`; development and build commands are root-directory dependent.
- `static.ts` uses `__dirname` and is known to work in the bundled CJS artifact.
- Phase 3 introduced `createRequire(process.cwd() + "/package.json")`, which is working around Prisma ESM/CJS compatibility but should not depend on the process working directory.
- PostgreSQL 17 was verified, but PostgreSQL credentials and role setup are local-only.

## Scalability and Performance Findings

- Product listing has limit validation, but no cursor or offset pagination.
- Cart, wishlist, reviews, and admin order queries have no pagination for large datasets.
- Admin statistics load all products to aggregate inventory in Node.
- Admin user/order endpoints are unbounded.
- Reviews by product are unbounded.
- No database migration or query metrics evidence.
- The frontend uses React Query but local fetches are not uniformly validated.
- Frontend asset images rely on external Unsplash URLs.
- Browser verification showed an external image blocked by ORB and another worker CSP violation.
- One combined process is appropriate now; Redis and queues are not justified by evidence.

## Reliability and Error Handling Findings

Positive:

- Central error handler and request IDs.
- Zod input validation.
- Domain errors and operational status codes.
- Graceful shutdown handlers.
- Existing async wrapper.

Weaknesses:

- Order creation is not atomic: stock check and order/cart operations can race or partially succeed.
- Cart quantity merge is race-prone.
- Shopify checkout has no retry policy but one external call can fail safely.
- Resend direct API integration lacks timeout configuration.
- Session store and Prisma use separate pools, but pool limits are not fully centralized.
- Health endpoint does not check database or external dependencies.
- Readiness/liveness separation is absent.
- Production start bundle externalizes `pg` but may need deployment-specific native dependency handling.

## Security Findings

| Severity | Issue |
|---|---|
| Critical | Demo account credentials and seed execution risk. |
| High | Runtime database connection appears intended to use `postgres`, a superuser, rather than a dedicated least-privilege role. |
| High | No CSRF token/defense visible; auth mutations rely mainly on session SameSite=Lax and CORS. |
| Medium | `trust proxy` is fixed to one hop in production and may differ from hosting topology. |
| Medium | Sessions use PostgreSQL and secure cookies in production, but no explicit cookie `domain`, rotating max lifetime, or idle expiration strategy is defined. |
| Medium | CORS allows only configured origins in production, but test and development behavior is permissive. |
| Medium | No authorization audit for all mutating Shopify/admin/order routes beyond session middleware. |
| Medium | Direct external credentials are correctly environment-based, but provider key/secret pairing validation is incomplete. |
| Medium | 20 production dependency vulnerabilities were reported by `npm audit --omit=dev`: 6 moderate and 14 high. |

Pino redacts password fields, but never print secret values in logs or reports.

## Testing Findings

Existing tests:

- Identity application tests.
- External authentication service tests.
- OAuth provider tests.
- Identity router/HTTP OAuth callback tests.

Missing critical coverage:

- End-to-end database integration.
- Cart/add/update/concurrency tests.
- Order creation/stock race tests.
- Shopify Storefront and cart mutation mocks.
- Resend HTTP mock tests.
- Frontend component tests.
- Browser registration/login/logout E2E automation.
- Migration tests from an existing schema.
- Session failure/database outage tests.
- Readiness/health tests.

Test isolation is good for identity. Database-dependent tests are absent.

## Observability Findings

Positive:

- Pino structured JSON logging.
- Request IDs.
- Basic health endpoint.
- OpenTelemetry support is opt-in.

Weaknesses:

- Health endpoint does not verify PostgreSQL.
- No readiness endpoint.
- No metrics, trace sampling policy, SLO, or incident dashboard.
- No audit log for admin actions or destructive catalog sync.
- Shopify and Resend failures contain no correlation ID in provider payload or retry context.
- OpenTelemetry startup failure is logged rather than enforced.

## Dependency Findings

- `npm ci` and `npm ls --depth=0` succeeded.
- `npm audit --omit=dev` found 20 production dependency findings: 6 moderate and 14 high.
- Direct Zod 3.25.76 is below the installed advisory fix 4.6.7, but upgrading is a major compatibility decision.
- Tailwind 3.4.19 is vulnerable according to the audit chain and has a major fix suggestion.
- Transitive `picomatch`, `brace-expansion`, `minimatch`, and `ip-address` findings require focused remediation.
- No broad dependency upgrades are recommended immediately.

## Phase 3 Change Review

| Change | Assessment |
|---|---|
| Prisma require bridge | Necessary for current clean-install runtime, but maintainability and CJS bundling compatibility need follow-up. |
| `dotenv/config` in DB client | Correct for standalone scripts; should be centralized so all startup paths initialize configuration once. |
| Optional environment preprocessors | Correct; blanks now behave as unset. |
| Production `NODE_ENV` handling | Fixed in `npm start`, but better to make the server script require an explicit environment and remove build-time `NODE_ENV` define ambiguity. |
| Externalized `pg` | Necessary for the observed production CJS crash and correct for native/ESM runtime separation. |
| Initial migration | Necessary and safe under `emebel_dev`; migration history is now reproducible. |
| Local seed | Correct for isolated local verification only; it needs a production guard. |
| `npm start` rewrite | Corrects the previous source/build mismatch. |

## Architecture Maturity Scores

| Dimension | Score | Evidence | Main weakness |
|---|---:|---|---|
| Maintainability | 3/5 | Modular routers/services and typed core | Direct persistence in routers, weak contracts |
| Modularity | 3/5 | Identity layering and commerce services | Inconsistent boundaries and direct infrastructure access |
| Type safety | 2/5 | Zod and strict TypeScript mostly used | Explicit `any`, `z.any()`, and unsafe assertions |
| Testability | 3/5 | 19 passing identity tests | Limited database/frontend/business workflow coverage |
| Portability | 3/5 | No runtime Replit dependency | `process.cwd()` and provider-specific deployment assumptions |
| Security | 2/5 | Helmet, CORS, rate limits, bcrypt, secure production cookies | Demo credentials, superuser role, no visible CSRF defense |
| Reliability | 2/5 | Health endpoint and graceful shutdown | Non-atomic commerce operations, weak readiness |
| Scalability | 2/5 | Limits and indexes from Prisma | Unbounded admin/review queries, no pagination |
| Extensibility | 3/5 | Interface-based email and OAuth modules | Shared route contracts need stronger typing |
| Observability | 2/5 | Pino, request IDs, optional OTEL | No metrics/readiness/provider correlation |
| Performance | 3/5 | Code splitting and API limits | External images, unbounded queries, bundle concerns |
| Deployment readiness | 2/5 | Local build/start/migration verified | CI, least-privilege DB, secret rotation, external smoke tests unresolved |

Overall maturity: **3/5 for source structure, 2/5 for production readiness**.
