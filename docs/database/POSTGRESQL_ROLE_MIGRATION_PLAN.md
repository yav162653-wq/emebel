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

CREATE ROLE emebel_migrator
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOREPLICATION
  NOBYPASSRLS;
```

The administrative session should set passwords using the deployment secret
manager:

```sql
ALTER ROLE emebel_app PASSWORD NULL;
ALTER ROLE emebel_migrator PASSWORD NULL;
```

`PASSWORD NULL` is not a proposed credential mechanism. It is a placeholder
showing that no password is established here. In implementation, use PostgreSQL
password setting via the approved secret-management process, never a password
committed to SQL or documentation.

### 2. Schema privileges

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO emebel_app;
GRANT USAGE, CREATE ON SCHEMA public TO emebel_migrator;
```

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

Sequence ownership:

```sql
ALTER SEQUENCE public.users_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.identities_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.newsletters_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.order_items_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.orders_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.products_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.reviews_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.cart_items_id_seq OWNER TO emebel_migrator;
ALTER SEQUENCE public.wishlists_id_seq OWNER TO emebel_migrator;
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

No runtime privileges are granted on `_prisma_migrations`.

### 5. Runtime sequence privileges

```sql
GRANT USAGE
ON SEQUENCE public.users_id_seq,
            public.identities_id_seq,
            public.newsletters_id_seq,
            public.order_items_id_seq,
            public.orders_id_seq,
            public.products_id_seq,
            public.reviews_id_seq,
            public.cart_items_id_seq,
            public.wishlists_id_seq
TO emebel_app;
```

### 6. Future object privileges

Set default privileges while acting as `emebel_migrator`:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE emebel_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO emebel_app;

ALTER DEFAULT PRIVILEGES FOR ROLE emebel_migrator IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO emebel_app;
```

This future-table grant is intentionally broad to match unknown future CRUD
models. A stricter implementation should replace it with a narrower generated
allowlist after new migrations are reviewed.

After these statements, the migrator should revoke broad default grants on
migration-table objects from runtime only if PostgreSQL creates future migration
journal objects outside application migrations.

## Session-store implementation constraint

Before switching runtime traffic:

```ts
createTableIfMissing: false
```

The migration role must create `session` and `IDX_session_expire` before runtime
startup. The runtime role may perform DML but must never perform DDL.

## Safe migration order

1. Take and verify a database backup.
2. Create roles with no superuser privileges.
3. Set passwords through the secret manager.
4. Grant schema and future-object privileges.
5. Transfer existing table/sequence/migration-table ownership.
6. Grant runtime DML privileges exactly as the matrix proposes.
7. Apply no application migration in this step; only role/object changes.
8. Test migrator connection and `prisma migrate status`.
9. Test app connection using a separate process and no production traffic.
10. Verify Prisma CRUD and session operations.
11. Change runtime deployment to `DATABASE_URL=emebel_app`.
12. Change migration job to `MIGRATION_DATABASE_URL=emebel_migrator`.
13. Disable runtime session auto-create.
14. Monitor startup, authentication, sessions, carts, and orders.

Do not switch the application until migrator status and runtime CRUD tests pass.

## Verification queries

Run read-only:

```sql
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin
FROM pg_roles
WHERE rolname IN ('emebel_app', 'emebel_migrator');

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

## Rollback procedure

1. Switch deployment back to the previous `DATABASE_URL`.
2. Stop migration jobs using `emebel_migrator`.
3. Revoke runtime grants from `emebel_app`.
4. Reassign application tables, sequences, indexes, and `_prisma_migrations`
   back to `postgres` or the original database owner.
5. Revoke migrator schema privileges.
6. Terminate active role sessions.
7. Drop roles only after confirming no application/process dependencies remain.
8. Restore session auto-create only as a temporary compatibility setting.

Rollback changes ownership and grants but does not need to delete any rows.

## Implementation risks

- Ownership transfer can invalidate scripts or backup tooling that assumes
  `postgres` is owner.
- Migrator default privileges apply only to future objects created by that role.
- Runtime role may need additional privileges discovered during integration
  testing or future migrations.
- Runtime migration table access must remain denied.
- Seed scripts should not use the runtime role.
- Passwords must be supplied by a secure secret system and rotated after the
  preflight.
