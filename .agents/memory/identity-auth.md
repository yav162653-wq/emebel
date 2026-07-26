---
name: Identity-centric auth architecture
description: User+Identity two-table pattern replacing direct password on User. Covers schema, passport, service, and migration approach.
---

## Rule
Never store passwords directly on the User model. All credentials live in the `Identity` table keyed by (provider, providerId).

## Schema
- `User`: id, username (nullable — OAuth users may have none), name, email (nullable), role, createdAt
- `Identity`: id, userId, provider ('local'|'google'|'telegram'|'github'), providerId, credentials (Json), createdAt
  - local: credentials = `{ hash: "$2b$..." }`
  - google/github/telegram: credentials = `{ accessToken, refreshToken }` etc.
  - Unique constraint: `@@unique([provider, providerId])`

## Lookup pattern (Prisma)
```ts
db.identity.findUnique({
  where: { provider_providerId: { provider: "local", providerId: username } },
  include: { user: true },
})
```

## Files
- `server/config/passport.ts` — LocalStrategy; serialize/deserialize by userId
- `server/utils/jwt.ts` — JwtUtil.sign/verify/decode; uses SESSION_SECRET; for mobile/bot clients
- `server/modules/auth/auth.service.ts` — login/register/findOrCreateOAuth/getIdentities
- `server/app.ts` — passport.initialize() + passport.session() after express-session

## Migration pattern
When existing users have passwords but no Identity records: write a one-off `migrate-identities.ts` script, run with `npx tsx`, then delete the script.

**Why:** Separating credentials from identity enables multi-provider login, account linking, and stateless JWT for bots without breaking web sessions.

**How to apply:** Any new OAuth provider (Google, Telegram, GitHub) calls `AuthService.findOrCreateOAuth({ provider, providerId, name, email, credentials })` — no User model changes needed.
