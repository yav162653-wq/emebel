# Database and Release Rollback Procedure

Prisma migrations in this repository are forward-only; there are no automatic
down migrations. Prefer a corrective forward migration when the current schema
can remain. Never edit an applied migration or manually alter
`_prisma_migrations` to simulate a rollback.

## Release rollback

1. Stop or reduce traffic and pause migration jobs.
2. If the prior application version supports the current schema, redeploy that
   artifact without changing the database.
3. Verify `/api/ready`, authentication, sessions, catalog reads, and order/cart
   integrity before restoring normal traffic.
4. Keep the pre-deployment backup until the incident is resolved.

## Database recovery

Use this only when data loss or an incompatible destructive schema change
requires point-in-time recovery:

1. Stop application writes and capture the failure time, migration name, and
   approved recovery point.
2. Restore the verified backup/PITR into a **new** isolated database. Do not
   overwrite the failed database.
3. Recreate roles from the secret manager and apply the PostgreSQL permission
   matrix. Set the recovery database's migration status and runtime grants.
4. Run integrity queries and application smoke checks against the new target.
5. Obtain explicit operator approval, then update `DATABASE_URL` for all app
   instances together and restart them.
6. Preserve the old database and backups until the restored service is accepted.
   Record data-loss window and recovery duration.

Do not run `prisma migrate reset`, use `db push --force-reset`, or apply an
unreviewed SQL reverse script to production. If restoration is not approved,
keep traffic stopped and use a reviewed forward-fix plan.

## Disposable restore test

`npm run test:db-recovery` creates a uniquely named disposable PostgreSQL
container, applies the checked-in migrations, creates a marker row, dumps and
restores the database to a separate database, and checks both the marker and
migration journal. It does not access production or claim to validate a
managed provider's point-in-time recovery.
