---
name: Prisma schema change workflow
description: Exact steps required after editing prisma/schema.prisma in SPACE. on Replit
---

## Required commands after any schema change
1. `npx prisma db push` — syncs DB schema (creates/alters tables)
2. `npx prisma generate` — regenerates the Prisma client JS

**Skipping step 2 causes runtime 500 errors** because the old client doesn't know about new models/fields.

## Config file
`prisma.config.ts` holds the datasource URL. The `schema.prisma` datasource block has no `url` field — this is intentional for Prisma 7 on Replit.

**Why:** Prisma 7 changed how datasource config works; URL lives in `prisma.config.ts` not `schema.prisma`.
