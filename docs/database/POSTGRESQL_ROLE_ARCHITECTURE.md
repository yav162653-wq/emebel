# eMebel PostgreSQL Role Architecture

## Scope and status

This is a read-only preflight design. No roles, passwords, environment variables,
migrations, records, ownerships, or grants were changed.

## Verified database state

At preflight time:

| Item | Observed value |
|---|---|
| Database | `emebel_dev` |
| Connected role | `postgres` |
| Superuser | Yes |
| Database owner | `postgres` |
| Public schema owner | `pg_database_owner` |
| Application table owner | `postgres` |
| Sequence owner | `postgres` |
| Migration table owner | `postgres` |
| Migration rows | 1 migration journal row |
| Existing `emebel_app` role | Not present |
| Existing `emebel_migrator` role | Not present |

The public schema exposed to the current superuser both `USAGE` and `CREATE`.
The migration table `_prisma_migrations` exists and is owned by `postgres`.

## Application database architecture

### Runtime path

[server/db/client.ts](/C:/Users/user/Downloads/eMebel/project/server/db/client.ts:1)
creates Prisma through `@prisma/adapter-pg` using `DATABASE_URL`.

[server/config/session.ts](/C:/Users/user/Downloads/eMebel/project/server/config/session.ts:6)
creates a separate `pg` pool using the same `DATABASE_URL` and stores sessions in
the `session` table. The session store currently has
`createTableIfMissing: true`.

[server/index.ts](/C:/Users/user/Downloads/eMebel/project/server/index.ts:28)
disconnects Prisma and closes the session pool during shutdown.

### Migration path

[prisma.config.ts](/C:/Users/user/Downloads/eMebel/project/prisma.config.ts:1)
currently uses `DATABASE_URL` for Prisma configuration.

[prisma/schema.prisma](/C:/Users/user/Downloads/eMebel/project/prisma/schema.prisma:1)
defines PostgreSQL tables, sequences, indexes, foreign keys, and
`@@map("session")`.

The only migration is
[20261118144134_init/migration.sql](/C:/Users/user/Downloads/eMebel/project/prisma/migrations/20261118144134_init/migration.sql).

Package scripts currently use:

- `npm run db:migrate` -> `prisma migrate deploy`
- `npm run db:push` -> `prisma db push`
- `npm run db:seed` -> `tsx server/db/seed.ts`

`db:migrate` applies the committed migration history. `db:push` remains available
for local schema prototyping and is not the deployment path. No `DIRECT_DATABASE_URL`,
`MIGRATION_DATABASE_URL`, or separate migration configuration currently exists.

## Target role design

### `emebel_app`

The normal application role should:

- have `LOGIN` because the application connects directly with this identity;
- be `NOSUPERUSER`;
- be `NOCREATEDB`;
- be `NOCREATEROLE`;
- be `NOINHERIT`;
- have no access to `_prisma_migrations`;
- have no `CREATE`, `ALTER`, `DROP`, or schema-owner privileges;
- receive only the table and sequence privileges required by runtime code;
- perform session insertion, update, selection, and pruning.

### `emebel_migrator`

The migration role should:

- be `NOSUPERUSER`;
- be `NOCREATEDB`;
- be `NOCREATEROLE`;
- have `USAGE` and `CREATE` on `public`;
- own or be explicitly allowed to alter existing application objects;
- own or be allowed to manage `_prisma_migrations`;
- receive default privileges for future tables and sequences;
- be used only for migrations and controlled administrative scripts.

The PostgreSQL superuser remains administrative and should not be used by
application or migration processes.

### Optional `emebel_seed`

The current seed process inserts catalog products using the same
`DATABASE_URL` as runtime. Granting runtime `INSERT` on `products` just to
support seeding would expand runtime privileges. The preferred design is a
separate development/test-only `emebel_seed` login and `SEED_DATABASE_URL`
with only `CONNECT`, schema `USAGE`, `SELECT`/`INSERT` on `products`, and
`USAGE` on `products_id_seq`. It must not be configured in production.

The seed policy must validate the host of `SEED_DATABASE_URL` itself, not only
the runtime URL. The seed process must use this URL through its own Prisma
client. If introducing a third role is not approved, the alternative is to
grant runtime `INSERT` on `products`; that is less restrictive and should be
an explicit decision.

## Connection architecture

Use separate connection variables:

- `DATABASE_URL`: runtime connection for `emebel_app`
- `MIGRATION_DATABASE_URL`: migration connection for `emebel_migrator`
- `SEED_DATABASE_URL`: optional local/test catalog-seed connection for
  `emebel_seed`

Reasons:

- Runtime and migration credentials can rotate independently.
- `prisma.config.ts` can point Prisma migrations at the migrator.
- Runtime code never receives schema-DDL privileges.
- Migration roles can be restricted to deployment jobs.
- Secret managers can revoke migrator access outside deployment.

Recommended [prisma.config.ts](/C:/Users/user/Downloads/eMebel/project/prisma.config.ts:1)
implementation after implementation approval:

```ts
datasource: {
  url: env("MIGRATION_DATABASE_URL"),
}
```

Runtime implementation should continue to read `DATABASE_URL` through
[server/config/env.ts](/C:/Users/user/Downloads/eMebel/project/server/config/env.ts:6).

The seed command currently imports the normal Prisma client. It must be changed
to construct a seed-only client from `SEED_DATABASE_URL` if the optional seed
role is adopted. The value must remain server-side and must never use a
`VITE_*` variable.

`DIRECT_DATABASE_URL` is a valid conventional alternative, but
`MIGRATION_DATABASE_URL` is clearer because this project has no pooled
serverless edge requirement today.

## Session table handling

The session table is application-owned runtime data. The runtime role needs:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`

The runtime role does not need `CREATE TABLE`, `ALTER TABLE`, or index privileges.

After migration verification:

- Remove `createTableIfMissing: true`.
- Set `createTableIfMissing: false`.
- Require migration/deployment to create `session` and `IDX_session_expire`.

This is safer than allowing runtime startup to perform DDL.

## Superuser guard

Normal runtime startup should fail closed in production:

1. Open a short-lived or pooled database connection using `DATABASE_URL`.
2. Execute a metadata-only query equivalent to:

```sql
SELECT rolsuper
FROM pg_roles
WHERE rolname = current_user;
```

3. Reject startup if `rolsuper` is true.
4. Optionally reject membership in superuser-like administrative roles by
   checking `pg_auth_members` and `pg_roles.rolsuper`.
5. Log only the role name and a safe failure code, never the connection string.
6. Perform the check before session-store or schema mutation logic starts.

The guard must be checked again after credential rotation and deployment
configuration changes.

## Future migrations

Do not grant broad default table privileges to `emebel_app`. PostgreSQL default
privileges cannot exclude `_prisma_migrations` by table name; a broad grant can
therefore violate the requirement that runtime cannot access the migration
journal when Prisma creates it in a fresh database.

Instead, after each successful migration, apply a versioned allowlist grant
script for the reviewed application tables and sequences in
[POSTGRESQL_PERMISSION_MATRIX.md](/C:/Users/user/Downloads/eMebel/project/docs/database/POSTGRESQL_PERMISSION_MATRIX.md).
New tables and sequences receive no runtime privileges until reviewed and
added to that script. The migrator remains the owner and can apply these grants.

After migration bootstrap, verify that `emebel_app` has no privileges on
`public._prisma_migrations`. Keep this check in the deployment/CI validation.

Migration role ownership of existing objects is preferred over a large set of
individual grants because future migrations must add columns, indexes, constraints,
and sequences through the migration identity.

## Risks

- Existing table and sequence ownership transfer can affect backup, restore,
  deployment scripts, and operational roles.
- The migrator role must receive ownership or sufficient ALTER privileges for
  every existing object.
- `public` schema behavior differs by PostgreSQL version and database defaults.
- The runtime role must not be owner or schema owner.
- Password and credential provisioning cannot be inferred from repository files.
- Seed scripts must not use runtime credentials if they can create/delete users
  or data outside normal application operations.
