# eMebel Technical Debt Register

## TD-001

- Severity: CRITICAL
- Category: Security/demo data
- File: `server/db/seed.ts:19-34`
- Description: Development seed creates accounts with password `password` and exposes matching credentials in the login UI.
- Evidence: Fixed password hashes and `nasa_admin`/`user` creation have no production guard.
- Impact: Known administrator credentials could compromise a production deployment.
- Recommended correction: Remove demo credentials from production; require `NODE_ENV=development/test` and explicit seed confirmation; remove demo login buttons from production.
- Complexity: Small.

## TD-002

- Severity: CRITICAL
- Category: Database security
- File: `server/db/client.ts:6-31`, `server/config/session.ts:6-12`
- Description: Runtime database configuration appears suitable for the PostgreSQL superuser and does not establish a dedicated application role.
- Evidence: Local setup used the `postgres` role and `DATABASE_URL` connection.
- Impact: Application compromise could grant database-level administration rights.
- Recommended correction: Create a dedicated least-privilege role for application CRUD and a separate migration role. Migrate and seed with elevated permissions only.
- Complexity: Medium.

## TD-003

- Severity: HIGH
- Category: Reliability
- File: `server/modules/orders/orders.router.ts:33-58`, `server/modules/orders/orders.service.ts:17-36`
- Description: Order creation does not use one transaction across stock verification, order creation, item creation, and cart deletion.
- Evidence: Separate service calls and database operations are sequenced without an explicit transaction.
- Impact: Partial orders or inventory/cart inconsistency under concurrency or failure.
- Recommended correction: Add one Prisma transaction; lock or conditional-update stock; make cart clearing part of the transaction; assign idempotency key.
- Complexity: Medium.

## TD-004

- Status: RESOLVED. Cart creation uses the `(userId, productId)` unique key
  with atomic upsert/increment. Quantity updates run in a transaction and
  writes/deletes are scoped to the owning user; concurrent disappearance is
  mapped to not-found. Client mutations have retries disabled because add is
  intentionally an increment operation.
- Severity: HIGH
- Category: Concurrency
- File: `server/modules/cart/cart.service.ts:14-38`
- Description: Cart quantity merge is find-then-create/find-then-update and can race.
- Evidence: Concurrent requests can create duplicate candidates or lose quantity updates.
- Impact: Incorrect cart quantities or constraint failures.
- Recommended correction: Use an atomic upsert or transaction with an explicit quantity constraint.
- Complexity: Small.

## TD-005

- Status: RESOLVED. Shared response contracts no longer use `z.any()`;
  current TypeScript sources contain no explicit `any` type or `z.any()`.
- Severity: HIGH
- Category: Type safety
- File: `shared/routes.ts:72,77,84,90`
- Description: API response contracts use `z.any()`.
- Evidence: Product, cart, and other responses are not validated or represented by shared schemas.
- Impact: Runtime shape drift and untyped frontend/backend integration.
- Recommended correction: Replace with explicit Zod schemas and typed response helpers.
- Complexity: Medium.

## TD-006

- Status: RESOLVED. Prisma event listeners now use generated event types and
  JWT verification validates payload claims with a shared Zod role schema.
- Severity: HIGH
- Category: Type safety
- File: `server/db/client.ts:35-43`
- Description: Three Prisma event callbacks use `any`.
- Evidence: Explicit `any` appears in query/error/warn event handlers.
- Impact: Runtime event shape changes can bypass static checking.
- Recommended correction: Use Prisma-generated event types or narrow unknown event values.
- Complexity: Small.

## TD-007

- Severity: HIGH
- Category: Security
- File: `server/app.ts:86-101`
- Description: No visible CSRF token/defense is implemented for state-changing session-authenticated endpoints.
- Evidence: `sameSite=lax` is the only browser cookie protection beside CORS.
- Impact: Cross-site forms or browser behavior may still present CSRF risk depending hosting/topology.
- Recommended correction: Add CSRF protection for cookie-authenticated mutations or adopt same-origin Origin/Referer verification plus token-based CSRF.
- Complexity: Medium.

## TD-008

- Severity: HIGH
- Category: Supply chain
- File: `package-lock.json`, `package.json`
- Description: Dependency audit reports 20 production findings.
- Evidence: 6 moderate and 14 high findings in `npm audit --omit=dev`.
- Impact: Known denial-of-service and package-chain risks.
- Recommended correction: Prioritize direct Zod, Tailwind, `express-rate-limit`, and transitive package fixes; test each update.
- Complexity: Medium.

## TD-009

- Severity: MEDIUM
- Category: Scalability
- File: `server/modules/admin/admin.service.ts:35-54`
- Description: Admin user and order queries are unbounded.
- Evidence: `findMany` calls return complete datasets.
- Impact: Memory/latency growth and payload amplification.
- Recommended correction: Add cursor or offset pagination, sorting, filters, and result limits.
- Complexity: Medium.

## TD-010

- Severity: MEDIUM
- Category: Scalability
- File: `server/modules/admin/admin.service.ts:13-26`
- Description: Inventory value and stock counts are computed by loading every product.
- Evidence: `db.product.findMany({ select: { price: true, stock: true } })`.
- Impact: Node memory and database transfer grow with catalog size.
- Recommended correction: Use database aggregates or maintain incrementally.
- Complexity: Small.

## TD-011

- Severity: MEDIUM
- Category: Scalability
- File: `server/modules/reviews/reviews.service.ts:21-24`
- Description: Product review queries are unbounded.
- Evidence: `findMany` has no limit or cursor.
- Impact: Large payload and slow rendering.
- Recommended correction: Add pagination and stable cursor.
- Complexity: Medium.

## TD-012

- Status: RESOLVED WITH BOUNDED RETRIES. Admin catalog queries and mutations
  carrying Shopify's `@idempotent` directive retry once with a 30-second request
  timeout; per-sync mutation keys are unique and product-create keys use the
  local product ID. Existing Shopify products are cursor-paginated. Storefront
  reads retry once, but `cartCreate` is intentionally never replayed because
  Storefront does not document mutation idempotency. A lost response can still
  leave an unreturned Shopify cart; durable checkout-request deduplication
  remains a separate follow-up if that risk is unacceptable.
- Severity: MEDIUM
- Category: Reliability
- File: `server/config/shopifyStorefrontClient.ts`, `script/shopify-admin-client.mjs`, `script/sync-shopify-catalog.ts`
- Description: Shopify catalog and checkout calls need bounded, operation-aware retry behavior.
- Evidence: Mocked tests cover read retries, idempotent Admin mutation retries, non-retryable cart creation, validation failures, and timeout classification.
- Impact: Unbounded or unsafe replay could duplicate catalog changes or carts.
- Recommended correction: Preserve the replay boundary; implement durable request-level checkout idempotency only if the product requires safe retry after ambiguous cart creation.
- Complexity: Medium.

## TD-013

- Severity: MEDIUM
- Category: Resilience
- File: `server/modules/identity/infrastructure/resend-email.sender.ts:32-68`
- Description: Direct Resend integration has no explicit timeout or retry policy.
- Evidence: Native `fetch` call has no `AbortSignal`.
- Impact: Requests can hang and block auth flows.
- Recommended correction: Add timeout, bounded retries, and provider-specific error mapping.
- Complexity: Small.

## TD-014

- Severity: MEDIUM
- Category: Observability
- File: `server/app.ts:105-108`
- Description: Health endpoint returns process status only.
- Evidence: No database or dependency check.
- Impact: Load balancers may route traffic when PostgreSQL or sessions are unavailable.
- Recommended correction: Separate liveness/readiness endpoints; check Prisma and session store readiness.
- Complexity: Medium.

## TD-015

- Severity: MEDIUM
- Category: Frontend types
- File: `client/src/app/providers/AuthProvider.tsx:10-12`
- Description: Login/register interfaces accept `any`.
- Evidence: Explicit `any` in auth context definitions.
- Impact: Payload validation can drift from API contracts.
- Recommended correction: Use `LoginRequest` and `InsertUser`.
- Complexity: Small.

## TD-016

- Severity: MEDIUM
- Category: Frontend resilience
- File: `client/src/pages/Landing/LandingPage.tsx:95`
- Description: Subscription error handler treats `any` and parses implementation-specific status text.
- Evidence: `err: any` and message includes `"409"`.
- Impact: Fragile response handling and weak typing.
- Recommended correction: Parse a typed API error response and domain error code.
- Complexity: Small.

## TD-017

- Severity: MEDIUM
- Category: Authentication
- File: `server/utils/jwt.ts:1-26`
- Description: JWT utility reuses the session secret and asserts payload types without runtime validation.
- Evidence: `jwt.verify(...) as JwtPayload`.
- Impact: Future activation could accept malformed payloads or couple JWT/session key compromise.
- Recommended correction: Remove until needed or introduce separate JWT secret, issuer/audience, and Zod validation.
- Complexity: Medium.

## TD-018

- Severity: MEDIUM
- Category: Database migration
- File: `prisma/migrations/20261118144134_init/migration.sql`
- Description: Initial migration is newly established but deployment and rollback procedures are not yet CI-enforced.
- Evidence: Migration was created in local development.
- Impact: Production schema drift or application/migration mismatch.
- Recommended correction: Use `prisma migrate deploy` in controlled CI/CD with backups and migration status checks.
- Complexity: Medium.

## TD-019

- Severity: MEDIUM
- Category: Testing
- File: `server/modules`, `client/src`
- Description: Only identity tests provide meaningful coverage.
- Evidence: Glob found four test files, all identity-focused.
- Impact: Critical cart, order, inventory, Shopify, and frontend workflows are unverified.
- Recommended correction: Implement integration and E2E coverage with real local PostgreSQL and mocked external providers.
- Complexity: High.

## TD-020

- Severity: MEDIUM
- Category: Portability
- File: `server/db/client.ts:7`
- Description: Database client computes Prisma require root from `process.cwd()`.
- Evidence: `createRequire(process.cwd() + "/package.json")`.
- Impact: Starting from another directory can select or resolve package configuration incorrectly.
- Recommended correction: Replace with a stable generated client import after confirming Prisma package ESM export, or isolate the require helper from working directory.
- Complexity: Medium.

## TD-021

- Severity: MEDIUM
- Category: Frontend delivery
- File: `server/app.ts:52`, `server/db/seed.ts`
- Description: External Unsplash assets and CSP worker behavior cause browser resource failures.
- Evidence: Browser observed blocked Unsplash image and worker CSP violation.
- Impact: Degraded UI and possible CSP restrictions for workers.
- Recommended correction: Host assets locally or in a vetted CDN and align worker CSP.
- Complexity: Medium.

## TD-022

- Severity: LOW
- Category: Seed safety
- File: `server/db/seed.ts`
- Description: Seed executes if products are empty and has no explicit command/environment guard.
- Evidence: No environment or confirmation guard.
- Impact: Accidental production seeding or overwriting demo state.
- Recommended correction: Require `NODE_ENV=development/test` and a separate explicit seed script.
- Complexity: Small.
