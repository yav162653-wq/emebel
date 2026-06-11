---
name: Prisma 7 on Replit
description: How to correctly configure Prisma 7 with PostgreSQL on Replit — schema.prisma no longer holds the connection URL.
---

## Rule
In Prisma 7, the `url = env("DATABASE_URL")` line in `schema.prisma` datasource is removed. Instead:

1. **`prisma.config.ts`** (project root) must specify the datasource URL:
   ```ts
   import { defineConfig, env } from "prisma/config";
   export default defineConfig({
     schema: "prisma/schema.prisma",
     datasource: { url: env("DATABASE_URL") },
   });
   ```

2. **`schema.prisma`** datasource has only `provider`:
   ```prisma
   datasource db { provider = "postgresql" }
   ```

3. **Runtime client** uses `@prisma/adapter-pg` (install separately):
   ```ts
   import { PrismaClient } from "@prisma/client";
   import { PrismaPg } from "@prisma/adapter-pg";
   import { Pool } from "pg";
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   const adapter = new PrismaPg(pool);
   export const db = new PrismaClient({ adapter });
   ```

4. **`app.set("trust proxy", 1)`** must be set before rate-limit middleware — Replit runs behind a reverse proxy.

5. Use `bcryptjs` (pure JS) not `bcrypt` (native) to avoid native binding issues in Replit's NixOS container.

**Why:** Prisma 7 separates the migration/introspection config (prisma.config.ts) from the runtime client config (adapter passed to PrismaClient constructor). The old schema.prisma url property is no longer valid.

**How to apply:** Any new Prisma setup on Replit must follow this pattern. Running `npx prisma db push` requires the prisma.config.ts file to exist with the datasource.url.
