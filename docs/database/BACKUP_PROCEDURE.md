# PostgreSQL Backup Procedure

## Production backup

Define an approved recovery point objective and recovery time objective before
launch. Use the database provider's encrypted point-in-time backups where
available, plus scheduled logical backups when portable restore is required.
Treat every backup as sensitive customer data.

For a logical backup, use a dedicated read-only backup credential supplied
through a protected `PGPASSFILE` or the hosting secret manager. Do not use the
application role, migration role, shell history, command-line passwords, or
write backups into the repository.

```powershell
$env:PGPASSFILE = "<protected path to pgpass file>"
pg_dump --no-password --format=custom --no-owner `
  --host=<HOST> --port=<PORT> --username=<BACKUP_ROLE> `
  --dbname=<DATABASE> --file="<encrypted backup path>"
pg_restore --list "<encrypted backup path>"
Get-FileHash "<encrypted backup path>" -Algorithm SHA256
Remove-Item Env:\PGPASSFILE
```

Restrict backup access, encrypt at rest and in transit, retain copies outside
the database failure domain, and record the checksum and backup timestamp.
Store role passwords in the secret manager; do not export global role password
hashes with `pg_dumpall --globals-only`.

## Restore rehearsal

1. Provision an isolated PostgreSQL database with the approved role bootstrap.
2. Restore the custom archive into the isolated target:

   ```powershell
   pg_restore --no-owner --exit-on-error --dbname=<ISOLATED_DATABASE> "<backup path>"
   ```

3. Apply the documented role grants, then run `prisma migrate status` using
   `MIGRATION_DATABASE_URL`.
4. Verify row counts, application/session readiness, and representative
   read/write flows. Never point a rehearsal at production.
5. Record the restore duration, checksum, migration state, and gaps; securely
   dispose of the rehearsal database and copied archive.

Run `npm run test:db-recovery` for the credential-free disposable-database
backup/restore regression. It verifies PostgreSQL archive restoration and
migration-journal preservation; it does not exercise a cloud provider's PITR.
