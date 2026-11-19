# eMebel Local Setup

## Required Software

- Windows 11 or supported Windows development environment
- Node.js 22.12 or newer
- npm
- Git
- PostgreSQL 17 or compatible PostgreSQL 14+

## 1. Install Dependencies

```powershell
Set-Location C:\Users\user\Downloads\eMebel\project
npm ci
```

Do not regenerate `package-lock.json` unless dependencies are intentionally changed.

## 2. Configure Local Environment

Copy the template:

```powershell
Copy-Item .env.example .env
```

At minimum, set:

```text
DATABASE_URL=postgresql://emebel_app:LOCAL_PASSWORD@localhost:5432/emebel_dev
# MIGRATION_DATABASE_URL is set only for schema CLI commands, not in this app .env.
SESSION_SECRET=LOCAL_RANDOM_SECRET
APP_ORIGIN=http://localhost:5000
```

Use a random local session secret and local database password. Do not reuse production credentials.

Blank optional values are accepted by the application as unset.

## 3. Create and Initialize PostgreSQL

Create a separate local database:

```sql
CREATE DATABASE emebel_dev;
```

Do not run reset or force-reset commands against an unknown database.

For a new database, use an administrative connection to apply the initial
migrations, then create the restricted roles and transfer table/sequence
ownership using [POSTGRESQL_ROLE_MIGRATION_PLAN.md](../database/POSTGRESQL_ROLE_MIGRATION_PLAN.md).
Apply the runtime allowlist from
[`runtime-grants.sql`](../../prisma/role-grants/runtime-grants.sql) as the
migrator. Do not expose the bootstrap credential to the application process.

Subsequent schema migrations use `MIGRATION_DATABASE_URL` only in the current
PowerShell session or deployment migration job:

```powershell
$env:MIGRATION_DATABASE_URL="postgresql://emebel_migrator:LOCAL_PASSWORD@localhost:5432/emebel_dev"
npx prisma migrate deploy
npx prisma migrate status
Remove-Item Env:\MIGRATION_DATABASE_URL
```

For local development with an existing migration, use `migrate deploy`. Do not run `prisma db push --force-reset`.

For production or shared-environment migration procedures, use
`docs/database/MIGRATION_PROCEDURE.md`. Never run migration or restore commands
against a database unless the target is explicitly confirmed.

## 4. Seed Local Demo Data

The current seed utility still uses `DATABASE_URL` and does not yet support
the optional `emebel_seed` connection. Leave demo seeding disabled with
`emebel_app`; do not grant the runtime role product `INSERT` only to enable
seed data. Seed-role wiring remains follow-up work, so seeding is currently unavailable
with `emebel_app`. The seed implementation creates local catalog data only; it
does not create fixed demo users, passwords, or frontend credential controls.

## Existing demo accounts

If a database was seeded before this remediation, demo accounts may already
exist. This remediation does not delete, rename, disable, or change them.
Before any production cleanup, an authorized operator must identify the affected
accounts and explicitly approve one of the following procedures: rotate the
passwords, disable the accounts, or remove them. Verify backups and dependencies
before deleting any real or historical account data.

## 5. Start Development

```powershell
npm run dev
```

Open `http://127.0.0.1:5000`.

The Express and Vite development servers run together in this process. Port 5000 is configured by `PORT` and is not a separate frontend process.

## 6. Production Artifact Test

```powershell
npm run build
npm start
```

`npm start` loads the generated `dist/index.cjs` server and sets production mode.

## 7. Quality Checks

```powershell
npm run check
npm test
npm run build
$env:MIGRATION_DATABASE_URL="postgresql://emebel_migrator:LOCAL_PASSWORD@localhost:5432/emebel_dev"
npx prisma validate
npx prisma migrate status
Remove-Item Env:\MIGRATION_DATABASE_URL
```

## 8. External Integrations

Without credentials:

- Core local product and account features remain available.
- Resend email delivery is unavailable.
- Magic-link delivery requires Resend and `AUTH_EMAIL_FROM`.
- OAuth providers remain disabled until each provider has credentials.
- Shopify checkout and catalog sync remain unavailable.

## Troubleshooting

### Prisma reports missing `DATABASE_URL`

Confirm `.env` exists and contains `DATABASE_URL`, then rerun the command.

### PostgreSQL authentication fails

Confirm the database role password and `DATABASE_URL` match. Use a separate local development database; do not point to production.

### Port 5000 is occupied

Set `PORT` to an available port in `.env` and use that URL.

### Email or OAuth works in tests but not locally

This means unit behavior is configured, but provider credentials or callbacks are not available. Configure approved sandbox credentials only.
