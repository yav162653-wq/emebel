# Secret Storage and Rotation

## Storage rules

- Store production secrets in the hosting platform's secret manager, not in
  source control, deployment artifacts, command arguments, or logs.
- Keep local values in `.env`; `.gitignore` excludes `.env` and `.env.*` while
  allowing only `.env.example`.
- `.env.example` contains placeholders and empty optional values only.
- Do not reuse `SESSION_SECRET` across environments or applications.
- Use independently generated credentials for PostgreSQL, Shopify, Resend,
  and each OAuth provider.

Production `SESSION_SECRET` must be at least 32 characters. Generate a
cryptographically random value and transfer it directly to the secret manager.
Never paste the generated value into source code, issue trackers, or chat.

## Rotating `SESSION_SECRET`

The session signing secret also derives OAuth state proofs. This application
does not support a multi-key overlap window, so rotation is a coordinated
logout and invalidates in-flight OAuth attempts.

1. Schedule a short maintenance window and ensure a known-good deployment is
   available.
2. Generate a new random secret in the approved secret manager.
3. Update `SESSION_SECRET` for every instance and restart them together.
4. Confirm login, logout, CSRF token retrieval, and an OAuth sign-in flow.
5. Monitor authentication errors and session-store health.
6. Expect existing browser sessions and pending OAuth flows to require restart.
   The session rows expire through the normal store TTL; do not dump them.
7. Revoke the prior secret from the secret manager after all instances have
   adopted the new value.

If verification fails, restore the previous secret and restart all instances
together. Avoid mixed-secret rolling deployments because instances would reject
each other's session cookies.

## Rotating provider and database credentials

1. Create a replacement credential using the provider's supported rotation
   process, keeping the old credential active during cutover when possible.
2. Update the appropriate environment secret (`DATABASE_URL`, `RESEND_API_KEY`,
   Shopify tokens, or provider client secret) without logging its value.
3. Restart or redeploy consumers and verify only the required integration.
4. Revoke the old credential at its source after successful verification.
5. Review access logs and rotate immediately if a credential may have leaked.

For database role changes and migration credentials, follow
[`MIGRATION_PROCEDURE.md`](../database/MIGRATION_PROCEDURE.md) and the separate
PostgreSQL role migration plan.
