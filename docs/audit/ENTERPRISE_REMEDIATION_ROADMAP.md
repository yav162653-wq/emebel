# eMebel Enterprise Remediation Roadmap

## Immediate Blockers

1. TD-001 - Disable/demo-gate all seed accounts and remove demo credential controls from production.
2. TD-002 - Create dedicated PostgreSQL migration/runtime roles and replace superuser configuration.
3. TD-003 - Put order creation and stock/cart mutations into transactions with idempotency.
4. TD-007 - Implement CSRF or strict Origin/Referer validation for cookie-authenticated mutations.
5. TD-018 - Define migration deployment, backup, status, and rollback procedures.

Dependencies: database role setup precedes production secret rotation; migration procedure precedes CI deployment.

## Security Improvements

1. Add server-side session idle/absolute lifetime policy.
2. Restrict cookie and proxy behavior to deployed hosting topology.
3. Validate provider credential pairs; do not partially enable providers.
4. Separate migration and runtime database credentials.
5. Remove or formally quarantine JWT utility until required.
6. Add admin audit events.

Dependencies: immediate database and CSRF work first.

## Type Safety Improvements

1. Replace `z.any()` and frontend `any` contracts.
2. Type Prisma event callbacks and JWT payload validation.
3. Centralize role and order status unions.
4. Replace unsafe non-null assertions at module boundaries with guards.
5. Enable strict ESLint unsafe-* rules.

Dependencies: shared schemas should be established before route/test automation.

## Seed and Mock Data Improvements

1. TD-022 - Environment-gate seed execution.
2. Move demo accounts and demo products to explicit fixtures or seed commands.
3. Add separate production/build compilation behavior for demo UI controls.
4. Document which seed data is development-only.

## Architecture Improvements

1. TD-004 - Make cart operations atomic.
2. TD-012 - Define Shopify idempotency and retry boundaries.
3. Route all order/cart persistence through application services.
4. Centralize configuration and remove working-directory assumptions.
5. Consolidate two PostgreSQL pools only if measured; otherwise document pool ownership.

Dependencies: transaction work precedes concurrency testing.

## Performance and Scalability Improvements

1. TD-009 - Paginate admin and review lists.
2. TD-010 - Move inventory statistics to database aggregates.
3. Add product cursor pagination.
4. Add database indexes for common filters and order lookups as query plans show demand.
5. Replace external image delivery where reliability or CSP is unacceptable.
6. Add bundle and API payload monitoring.

No Redis, queue, or microservice work is warranted yet.

## Reliability Improvements

1. TD-014 - Split health and readiness.
2. Add database readiness and session-store checks.
3. TD-013 - Add Resend timeout and bounded retry policy.
4. Add Shopify timeout classification and idempotency.
5. Add graceful shutdown tests and verify pool closure.

## Testing Improvements

1. Add PostgreSQL integration-test setup independent of `emebel_dev`.
2. Test order/cart stock races and duplicate requests.
3. Test Shopify Storefront with a mock GraphQL endpoint.
4. Test Resend with mocked HTTP.
5. Add frontend registration/login/logout and routing tests.
6. Add migration apply/status tests.
7. Add session expiration and database failure tests.
8. Retain identity unit tests and extend the existing HTTP router suite.

## Observability Improvements

1. Structured logs already exist: expand correlation fields.
2. Add metrics for request count, latency, DB pool, and external provider failures.
3. Add tracing spans for Shopify, Resend, Prisma, and auth callbacks.
4. Add provider-safe audit events for admin mutations and catalog synchronization.
5. Establish incident dashboards and SLOs after production traffic exists.

## Dependency Improvements

1. Completed: production and full dependency audits report zero vulnerabilities after the Zod, Vitest, gaxios, and minimatch remediations.
2. Keep the lockfile and `npm audit` CI gates with an approved exception policy.
3. Plan an ESLint 10 migration separately; npm reports the current ESLint 9.39.5 release as unsupported.
4. Do not upgrade Prisma major versions in this phase.

## Production Readiness

1. Complete CI pipeline for install, migrate status/apply, check, test, build.
2. Verify one clean Linux deployment in Docker or standard Node host.
3. Rotate/verify secrets and external provider credentials.
4. Run Shopify, Resend, and OAuth sandbox verification.
5. Add backup and migration rollback evidence.
6. Complete browser smoke automation.
7. Remove Replit remotes and configure the GitHub remote.

## Recommended Implementation Order

1. TD-001 and TD-022
2. TD-002
3. TD-007
4. TD-003 and TD-004
5. TD-005 and TD-006
6. TD-014 and TD-013
7. TD-018
8. TD-008
9. TD-009 to TD-011
10. TD-019
11. Deployment and external-service verification
