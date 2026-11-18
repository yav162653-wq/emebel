# eMebel PostgreSQL Permission Matrix

## Scope

This matrix reflects the current Prisma schema and application access paths.
No database privileges are currently assigned to the proposed roles.

Confirmed current state:

- Runtime currently connects as PostgreSQL superuser `postgres`.
- All application tables are owned by `postgres`.
- All application sequences are owned by `postgres`.
- Session and migration indexes are owned by `postgres`.
- `emebel_app` and `emebel_migrator` do not exist.

## Runtime role: `emebel_app`

Legend:

- **R** = `SELECT`
- **I** = `INSERT`
- **U** = `UPDATE`
- **D** = `DELETE`
- `-` = no privilege

| Table | R | I | U | D | Runtime evidence |
|---|---|---|---|---|---|
| `users` | Yes | Yes | Yes | No | Identity registration/profile updates, auth lookup |
| `identities` | Yes | Yes | Yes | No | Identity creation/linking/touch |
| `organizations` | Yes | Yes | Yes | No | Personal workspace creation |
| `memberships` | Yes | Yes | Yes | No | Workspace membership creation/updates |
| `auth_tokens` | Yes | Yes | Yes | Yes | Create, consume, and delete magic/account-link tokens |
| `external_auth_transactions` | Yes | Yes | Yes | Yes | Create, claim, and clean OAuth transactions |
| `session` | Yes | Yes | Yes | Yes | connect-pg-simple get/set/touch/destroy/prune |
| `products` | Yes | No | Yes | No | Product reads and admin product updates |
| `cart_items` | Yes | Yes | U | Yes | Add, quantity update, remove, clear |
| `orders` | Yes | Yes | Yes | No | Create and status update in current code |
| `order_items` | Yes | Yes | No | No | Create order items; read order history |
| `wishlists` | Yes | Yes | No | Yes | Add/remove/sync/clear |
| `reviews` | Yes | Yes | Yes | Yes | Upsert and remove reviews |
| `newsletters` | Yes | Yes | No | No | Newsletter registration/lookup |
| `_prisma_migrations` | No | No | No | No | Migration journal is migration-only |

The matrix is intentionally narrower than a generic CRUD role. Optional future
features require re-review before adding privileges.

## Runtime schema and sequence privileges

| Object | Runtime privilege |
|---|---|
| `public` schema | `USAGE` only |
| Application sequences | `USAGE` |
| `_prisma_migrations` | None |
| Schema `CREATE` | None |
| Table `TRUNCATE` | None |
| Table `REFERENCES` | None |
| Table `TRIGGER` | None |
| Database `CREATE` | None |
| Role creation | None |
| Superuser | None |

Sequence list requiring `USAGE`:

- `cart_items_id_seq`
- `identities_id_seq`
- `newsletters_id_seq`
- `order_items_id_seq`
- `orders_id_seq`
- `products_id_seq`
- `reviews_id_seq`
- `users_id_seq`
- `wishlists_id_seq`

## Migration role: `emebel_migrator`

| Operation | Migration role |
|---|---|
| `SELECT` application tables | Yes, as needed by migration tooling |
| `INSERT` application tables | Yes, only for controlled seed/admin tooling |
| `UPDATE` application tables | Yes, only for controlled migrations/scripts |
| `DELETE` application tables | Yes, only for controlled migrations/scripts |
| `CREATE TABLE` | Yes |
| `ALTER TABLE` | Yes |
| `DROP TABLE` | Yes |
| `CREATE INDEX` | Yes |
| `ALTER INDEX` | Yes |
| `CREATE SEQUENCE` | Yes |
| `ALTER SEQUENCE` | Yes |
| `CREATE EXTENSION` | No by default |
| `_prisma_migrations` read/write | Yes |
| Role creation | No |
| Superuser | No |

The migration role should own or be granted explicit ALTER ownership over existing
application objects. After migration ownership transfer, table and sequence
ownership should be `emebel_migrator`.

## Session store operations

`connect-pg-simple` performs:

| Operation | Runtime requirement |
|---|---|
| Prune expired sessions | `DELETE` on `session` |
| Create/update session | `INSERT` and `UPDATE` on `session` |
| Retrieve session | `SELECT` on `session` |
| Destroy session | `DELETE` on `session` |
| Touch session expiration | `UPDATE` on `session` |
| Auto-create table | None after migration; disable runtime auto-create |

## Direct PostgreSQL access inventory

Runtime PostgreSQL access is through:

- Prisma in [server/db/client.ts](/C:/Users/user/Downloads/eMebel/project/server/db/client.ts:1)
- `pg` pools in [server/config/session.ts](/C:/Users/user/Downloads/eMebel/project/server/config/session.ts:6)
- maintenance scripts in [server/db/seed.ts](/C:/Users/user/Downloads/eMebel/project/server/db/seed.ts:1)
  and [server/db/update-products.ts](/C:/Users/user/Downloads/eMebel/project/server/db/update-products.ts:1)

Maintenance scripts should use `MIGRATION_DATABASE_URL` or a dedicated seed role,
not normal runtime `DATABASE_URL`.

## Variables

| Variable | Identity | Use |
|---|---|---|
| `DATABASE_URL` | `emebel_app` | Normal application startup and runtime CRUD |
| `MIGRATION_DATABASE_URL` | `emebel_migrator` | Prisma migration/deploy/status and controlled schema work |

No passwords or credential values are included in this matrix.
