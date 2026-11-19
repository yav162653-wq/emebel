# eMebel PostgreSQL Role Migration Plan

## Read-only preflight result

Verified:

- Database: `emebel_dev`
- Runtime role: `postgres`
- Runtime role is a superuser
- Database owner: `postgres`
- Public schema owner: `pg_database_owner`
- All 15 application/migration tables are owned by `postgres`
- All 9 serial sequences are owned by `postgres`
- `_prisma_migrations` exists with 1 migration row
- `session` and `IDX_session_expire` exist and are owned by `postgres`
- `emebel_app` and `emebel_migrator` do not exist

## Proposed SQL

The implementation phase should use an administrative superuser session outside
the application. Password values must come from the deployment secret manager
and must not be embedded in source or logs.

### 1. Create roles

```sql
CREATE ROLE emebel_app
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOREPLICATION
  NOBYPASSRLS;

-- Optional: create only if the dedicated seed role is approved.
CREATE ROLE emebel_seed
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOREPLICATION
  NOBYPASSRLS;

CREATE ROLE emebel_migrator
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOREPLICATION
  NOBYPASSRLS;
```

Do not run `ALTER ROLE ... PASSWORD NULL`: it clears a role's password; it does
not provision one. Set passwords separately using the approved secret
management process. For an interactive local PostgreSQL session, use psql's
password prompt:

```text
\password emebel_app
\password emebel_seed
\password emebel_migrator
```

Skip the `emebel_seed` password command if the optional role is not created.
Never put plaintext passwords in SQL files, shell history, source, logs, or
documentation. Do not configure `emebel_seed` in production.

### 2. Database and schema privileges

```sql
-- Remove emebel_seed from this grant if the optional role is not created.
GRANT CONNECT ON DATABASE emebel_dev
  TO emebel_app, emebel_seed, emebel_migrator;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO emebel_app;
-- Optional: run only when emebel_seed was created.
GRANT USAGE ON SCHEMA public TO emebel_seed;
GRANT USAGE, CREATE ON SCHEMA public TO emebel_migrator;
```

`emebel_dev` is the verified local database name; substitute the explicitly
verified database name in another environment. Revoke `CREATE` from `PUBLIC`
only after confirming this is a dedicated eMebel database/schema and reviewing
other roles and services that may rely on the current grant. Do not revoke
database-wide privileges from `PUBLIC` without the same review.

### 3. Transfer existing object ownership

Transfer application and session objects to the migrator:

```sql
ALTER TABLE public.users OWNER TO emebel_migrator;
ALTER TABLE public.identities OWNER TO emebel_migrator;
ALTER TABLE public.organizations OWNER TO emebel_migrator;
ALTER TABLE public.memberships OWNER TO emebel_migrator;
ALTER TABLE public.auth_tokens OWNER TO emebel_migrator;
ALTER TABLE public.external_auth_transactions OWNER TO emebel_migrator;
ALTER TABLE public.session OWNER TO emebel_migrator;
ALTER TABLE public.products OWNER TO emebel_migrator;
ALTER TABLE public.cart_items OWNER TO emebel_migrator;
ALTER TABLE public.orders OWNER TO emebel_migrator;
ALTER TABLE public.order_items OWNER TO emebel_migrator;
ALTER TABLE public.wishlists OWNER TO emebel_migrator;
ALTER TABLE public.reviews OWNER TO emebel_migrator;
ALTER TABLE public.newsletters OWNER TO emebel_migrator;
ALTER TABLE public._prisma_migrations OWNER TO emebel_migrator;
```

Changing ownership of each table transfers its owned serial sequence as well.
After the table ownership transfer, verify the sequence owners and explicitly
alter only any standalone sequence that remains owned by the bootstrap role:

```sql
SELECT c.relname, pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'S'
ORDER BY c.relname;
```

Ownership transfer changes index and object ownership as PostgreSQL applies
ALTER TABLE. It does not delete or rewrite table data.

### 4. Runtime table privileges

```sql
GRANT SELECT, INSERT, UPDATE
ON TABLE public.users,
         public.identities,
         public.organizations,
         public.memberships
TO emebel_app;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.auth_tokens,
         public.external_auth_transactions,
         public.session
TO emebel_app;

GRANT SELECT, UPDATE
ON TABLE public.products
TO emebel_app;

-- Optional: run only when emebel_seed was created.
GRANT SELECT, INSERT
ON TABLE public.products
TO emebel_seed;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.cart_items
TO emebel_app;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.orders
TO emebel_app;

GRANT SELECT, INSERT
ON TABLE public.order_items
TO emebel_app;

GRANT SELECT, INSERT, DELETE
ON TABLE public.wishlists
TO emebel_app;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.reviews
TO emebel_app;

GRANT SELECT, INSERT
ON TABLE public.newsletters
TO emebel_app;
```

No runtime or seed privileges are granted on `_prisma_migrations`.

### 5. Runtime and seed sequence privileges

```sql
GRANT USAGE
ON SEQUENCE public.users_id_seq,
            public.identities_id_seq,
            public.newsletters_id_seq,
            public.order_items_id_seq,
            public.orders_id_seq,
            public.reviews_id_seq,
            public.cart_items_id_seq,
            public.wishlists_id_seq
TO emebel_app;

-- Optional: run only when emebel_seed was created.
GRANT USAGE ON SEQUENCE public.products_id_seq TO emebel_seed;
```

After migration deploy, apply the reviewed allowlist in
[`prisma/role-grants/runtime-grants.sql`](../../prisma/role-grants/runtime-grants.sql)
as the migrator, which owns the application tables and sequences. Revoke
`CREATE` from `PUBLIC` on `public` once using the administrative bootstrap
connection; the migrator is not the schema owner.

Do not grant broad default table or sequence privileges to runtime. After each
successful migration, the migrator should apply a versioned, reviewed allowlist
grant script for application tables and sequences. Add new tables/sequences to
the matrix and grant script only after their runtime operations are reviewed.
This keeps `_prisma_migrations` inaccessible to runtime, including on a fresh
database.

As a defensive check after `migrate deploy`, explicitly revoke any accidental
runtime grants on the existing journal:

```sql
REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM emebel_app;
-- Optional: run only when emebel_seed was created.
REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM emebel_seed;
```

## Session-store implementation constraint

Before switching runtime traffic:

```ts
createTableIfMissing: false
```

The migration role must create `session` and `IDX_session_expire` before runtime
startup. The runtime role may perform DML but must never perform DDL.

## Safe migration order

1. Reconfirm the target database, role memberships, schema ACLs, object owners,
   session table, and migration journal using read-only queries. Stop if the
   database/schema is shared with another application.
2. Take a custom-format backup using an approved credential prompt/secret
   mechanism, then verify the archive with `pg_restore --list`. Rehearse restore
   to an isolated scratch database when available.
3. Create `emebel_app` and `emebel_migrator` with no superuser/database/role
   creation rights. Create `emebel_seed` only if the separate seed role is
   approved. Provision passwords separately.
4. Grant `CONNECT` and schema access. Revoke `CREATE` from `PUBLIC` only after
   the dedicated-schema/database and dependent-role review.
5. Transfer existing application tables, sequences, and `_prisma_migrations`
   to `emebel_migrator`; do not transfer database or schema ownership.
6. Grant runtime and optional seed privileges exactly as listed above. Apply
   no broad default DML grants.
7. Change Prisma CLI configuration to use `MIGRATION_DATABASE_URL`; keep
   application Prisma and session pools on `DATABASE_URL`. Give the seed
   process `SEED_DATABASE_URL` only if its dedicated role is adopted.
8. Disable session auto-creation in runtime. The migrator must create
   `session` and `IDX_session_expire` before application startup.
9. Run `prisma migrate status` and `prisma migrate deploy` with the migrator
   identity; apply the reviewed allowlist grants after migration.
10. Verify runtime CRUD and session operations in a separate process. Verify
    runtime cannot read `_prisma_migrations` or create/alter/drop schema objects.
11. Add a production startup guard that requires the expected least-privilege
    runtime role before the HTTP server begins listening. Do not log connection
    strings or passwords.
12. Switch only the local development runtime to `DATABASE_URL=emebel_app`
    after all checks pass. Preserve the prior admin connection for rollback.
13. Validate CI with separate migration and runtime identities before any
    hosted deployment. Do not apply these changes to production without a
    separate review and explicit approval.

Do not switch the application until migrator status and runtime CRUD tests pass.

Example PowerShell backup commands for the verified local database (the
password is prompted for or supplied through an approved `PGPASSFILE`; never
put it in the command line):

```powershell
pg_dump --format=custom --host=localhost --port=5432 --username=postgres `
  --dbname=emebel_dev --file="$env:TEMP\emebel_dev-before-role-change.dump"
pg_restore --list "$env:TEMP\emebel_dev-before-role-change.dump"
```

Protect the backup file with user-only filesystem permissions. A successful
`pg_restore --list` checks archive readability, not restore correctness; use a
separate scratch database for a restore rehearsal and never use a destructive
restore option against the working database.

## Verification queries

Run read-only:

```sql
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin
FROM pg_roles
WHERE rolname IN ('emebel_app', 'emebel_seed', 'emebel_migrator');

SELECT c.relname, pg_get_userbyid(c.relowner)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname;

SELECT table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'emebel_app'
ORDER BY table_name, privilege_type;

SELECT c.relname,
       has_sequence_privilege('emebel_app', c.oid, 'USAGE')
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'S'
ORDER BY c.relname;

SELECT
  has_schema_privilege('emebel_app', 'public', 'CREATE') AS can_create_in_schema,
  has_database_privilege('emebel_app', current_database(), 'CREATE') AS can_create_database,
  has_table_privilege('emebel_app', 'public._prisma_migrations', 'SELECT') AS can_read_migration_journal,
  has_table_privilege('emebel_app', 'public._prisma_migrations', 'INSERT') AS can_insert_migration_journal,
  has_table_privilege('emebel_app', 'public._prisma_migrations', 'UPDATE') AS can_update_migration_journal,
  has_table_privilege('emebel_app', 'public._prisma_migrations', 'DELETE') AS can_delete_migration_journal;
```

Runtime test should verify:

- user, identity, workspace, and auth-token operations;
- session create/read/update/delete/prune;
- product read/admin update;
- cart CRUD;
- wishlist CRUD;
- review CRUD;
- newsletter insert;
- order/order-item insert and read;
- no `_prisma_migrations` access;
- no CREATE TABLE/ALTER TABLE/DROP TABLE ability.

Run verification using the restricted runtime connection. The expected values
for `can_create_in_schema`, `can_create_database`, and all migration-journal
privileges are `false`. Also attempt DDL in a disposable transaction and verify it is denied;
do not use a production database for that probe.

## Rollback procedure

1. Switch deployment back to the previous `DATABASE_URL`.
2. Stop migration jobs using `emebel_migrator`.
3. Revoke runtime grants from `emebel_app`.
4. Reassign application tables, sequences, indexes, and `_prisma_migrations`
   back to `postgres` or the original database owner.
5. Revoke migrator schema privileges.
6. Terminate active role sessions.
7. Keep the prior administrative credential available until rollback is no
   longer required; rotate it separately after successful cutover.
8. Drop the new roles only after confirming no application/process dependencies
   remain. Restore session auto-create only as a temporary compatibility measure.

Rollback changes ownership and grants but does not need to delete any rows.

## Implementation risks

- Ownership transfer can invalidate scripts or backup tooling that assumes
  `postgres` is owner.
- Runtime permissions for new application objects must be added to the reviewed
  grant allowlist after each migration.
- Runtime migration table access must remain denied.
- The current seed script inserts products but the runtime permission matrix
  intentionally denies product inserts; use the optional seed role or approve
  the less-restrictive runtime grant before changing the seed connection.
- Passwords must be supplied by a secure secret system and rotated after the
  preflight.
