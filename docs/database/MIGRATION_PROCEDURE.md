# Migration Deployment and Rollback Procedure

This procedure applies only to PostgreSQL databases explicitly selected and
approved for migration. It does not run migrations automatically.

## Preconditions

- Identify the exact database and deployment environment.
- Use `MIGRATION_DATABASE_URL` for schema commands in production; never use
  the application role for DDL.
- Keep `MIGRATION_DATABASE_URL` out of the application runtime environment.
- Require an operator to confirm the migration list and target database.
- Take a backup immediately before deployment.
- Apply migrations to a disposable database or staging environment first.

## Pre-deployment checks

Run with a read-only or migration credential:

```powershell
$env:MIGRATION_DATABASE_URL="<migration-role connection string>"
npx prisma validate
npx prisma migrate status
npx prisma generate
Remove-Item Env:\MIGRATION_DATABASE_URL
```

Inspect all SQL under `prisma/migrations/` and confirm no unrelated schema reset
or destructive command is present.

Check the migration journal:

```sql
SELECT migration_name, finished_at, rolled_back_at, logs
FROM "_prisma_migrations"
ORDER BY started_at DESC;
```

Stop if the target migration is already applied with the wrong checksum or an
earlier migration is marked failed.

## Backup

Create a custom-format PostgreSQL backup with credentials from an approved
secret mechanism:

```powershell
pg_dump --format=custom --host=<HOST> --port=<PORT> `
  --username=<MIGRATION_ROLE> --dbname=<DATABASE> `
  --file="<BACKUP_PATH>"

pg_restore --list "<BACKUP_PATH>"
```

Never place passwords on the command line. Verify archive readability and
rehearse restore against an isolated disposable database.

## Deployment

After backup verification:

```powershell
$env:MIGRATION_DATABASE_URL="<migration-role connection string>"
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
Remove-Item Env:\MIGRATION_DATABASE_URL
```

After each migration, apply
[`runtime-grants.sql`](../../prisma/role-grants/runtime-grants.sql) as the
migrator and verify the runtime allowlist. On initial bootstrap, revoke
`CREATE` from `PUBLIC` on the `public` schema using the administrative
connection before granting runtime access.
Provide `MIGRATION_DATABASE_URL` only to the migration command/job; remove it
from the shell after local migration commands and do not include it in the app
runtime environment or `.env` loaded by the application.

Do not run `prisma db push`, `migrate reset`, or `db push --force-reset` for
hosted databases.

After deployment:

1. Confirm migration status contains no pending or failed migrations.
2. Run read-only integrity queries.
3. Run application smoke checks against a staging deployment.
4. Verify runtime CRUD, sessions, cart, wishlist, stock, and order operations.
5. Confirm the application role cannot perform DDL or read migration secrets.

The order idempotency migration must verify the unique
`(userId, idempotencyKey)` index and the nullable hash/key columns.

## Rollback

Prefer forward repair unless data loss is explicitly approved. If rollback is
required:

1. Stop new application traffic or place the service into maintenance mode.
2. Restore application configuration to the previous released artifact.
3. Stop migration jobs using the migration role.
4. Restore the pre-deployment backup to a separate database or authorized
   recovery target.
5. If only application code caused the failure, redeploy the previous artifact
   without altering the database.
6. Do not hand-edit `_prisma_migrations`.
7. Re-run migration status and application smoke tests after recovery.

For a forward-fix migration, add a corrective migration rather than deleting or
editing an already-applied migration. Preserve the backup until the release is
accepted.
