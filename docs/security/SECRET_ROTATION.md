# Secret Storage and Rotation

## Secret inventory

| Secret | Consumer and rotation notes |
|---|---|
| `SESSION_SECRET` | Signs sessions, JWTs, and OAuth state proofs; one coordinated rotation invalidates sessions and pending OAuth flows. |
| `DATABASE_URL` | Runtime `emebel_app` connection; the role name is checked at startup. |
| `MIGRATION_DATABASE_URL` | Migration jobs only; never inject into the application container. |
| `POSTGRES_ADMIN_PASSWORD` | Compose database bootstrap/admin only; not an app credential. |
| `RESEND_API_KEY` | Email sender; provision a replacement, cut over, then revoke the old key. |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Storefront client; replace in Shopify and verify a read-only storefront query. |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Catalog-sync script; replace and verify against a development store. |
| `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`, `TELEGRAM_CLIENT_SECRET` | OAuth code-exchange credentials; rotate in each provider's separate test/production app. |
| `METRICS_TOKEN` | Prometheus scraper bearer credential; coordinate scraper and app configuration. |

`SHOPIFY_SHOP_DOMAIN`, OAuth client IDs, and `AUTH_EMAIL_FROM` identify
integrations but are not credentials. The application has no independent
`JWT_SECRET`: JWT and OAuth state proofs currently derive from `SESSION_SECRET`.

## Storage rules

- Store production secrets in the hosting platform's secret manager, not in
  source control, deployment artifacts, command arguments, or logs.
- Keep local values in `.env` or `.env.compose`; Git ignores both. The checked-in
  `.env.example` and `.env.compose.example` contain placeholders only.
- Do not reuse secrets across environments, applications, or providers.
- Generate random, URL-safe PostgreSQL passwords for Compose connection URLs.
- Limit `MIGRATION_DATABASE_URL` and `POSTGRES_ADMIN_PASSWORD` to migration and
  database administration jobs; do not expose them to the application runtime.
- Record rotation owner, timestamp, affected service, and verification result,
  never the secret value.

Production `SESSION_SECRET` must be at least 32 characters. Generate it with a
cryptographically secure source and transfer it directly to the secret manager.

## Rotating `SESSION_SECRET`

The application has no old/new key overlap. A zero-downtime session/JWT
rotation is therefore **not supported**; do not perform a mixed-secret rolling
deployment because instances would reject each other's cookies and OAuth state.

1. Schedule a coordinated restart and confirm the prior deployment is available.
2. Generate and stage a new random secret in the secret manager.
3. Update every instance together, then restart/redeploy all app instances.
4. Verify login, logout, CSRF token retrieval, JWT-protected flows, OAuth state,
   and session-store readiness.
5. Expect existing sessions and in-flight OAuth attempts to be invalidated;
   session rows expire via the store TTL.
6. Revoke the old value after verification. If verification fails, restore it
   everywhere together and investigate before retrying.

## Rotating database credentials

`DATABASE_URL` must continue to authenticate as `emebel_app`; alternate runtime
role names fail the production least-privilege startup check. PostgreSQL permits
only one current password for this role, so rotation has no credential overlap:

1. Schedule a brief reconnect window and confirm a tested rollback configuration.
2. Generate a new URL-safe password and update `emebel_app` in the database.
3. Update `DATABASE_URL` on all app instances and restart them together.
4. Verify `/api/ready`, runtime CRUD, and session operations before ending the
   window. Existing pool connections may survive the password change, but new
   connections using the old URL will fail.

For `MIGRATION_DATABASE_URL`, change the `emebel_migrator` password and the
migration-job secret; verify `prisma migrate status` before retiring the prior
job configuration. Follow [`MIGRATION_PROCEDURE.md`](../database/MIGRATION_PROCEDURE.md).
Compose role passwords are consumed only when initializing an empty database
volume; changing a Compose variable does not change an existing PostgreSQL role.

## Rotating provider credentials

For Resend, Shopify, and each OAuth provider, use that provider's credential
management process to create or activate a replacement. Update only the
corresponding secret, restart the consumer, verify with a test recipient,
development store, or provider test application, then revoke the old credential.
If the provider does not allow overlapping credentials, schedule a coordinated
cutover and expect a short integration interruption. Revoke a suspected
compromised key immediately, before routine verification.

For `METRICS_TOKEN`, deploy the new value and update the scraper in one
coordinated change; the current endpoint accepts only one token at a time.

## Emergency rotation

1. Disable/revoke the exposed credential at its issuer immediately.
2. Restrict affected app/database access and preserve sanitized audit evidence.
3. Generate replacements and update all affected secret-manager entries.
4. Restart consumers; for `SESSION_SECRET`, restart all app instances together.
5. Verify health/readiness and the affected integration using non-production
   accounts, then monitor authentication/provider failures.
6. Review access logs, remove the exposed value from any managed secret store,
   and document incident scope without reproducing the value.
