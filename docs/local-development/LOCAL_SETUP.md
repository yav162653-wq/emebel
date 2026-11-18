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
DATABASE_URL=postgresql://postgres:LOCAL_PASSWORD@localhost:5432/emebel_dev
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

Apply the repository migration:

```powershell
npx prisma migrate deploy
npx prisma migrate status
```

For local development with an existing migration, use `migrate deploy`. Do not run `prisma db push --force-reset`.

## 4. Seed Local Demo Data

Run the seed only after confirming `DATABASE_URL` targets `emebel_dev`:

```powershell
$env:SEED_DEMO_DATA="true"
npm run db:seed
```

Seed execution requires `SEED_DEMO_DATA=true`, `NODE_ENV=development` or `test`,
and a localhost database URL. It is disabled by default and is prohibited in
production.

The seed creates local catalog data only. It does not create fixed demo users,
passwords, or frontend credential controls.

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
npx prisma validate
npx prisma migrate status
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
