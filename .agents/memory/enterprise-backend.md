---
name: Enterprise backend architecture (SPACE. app)
description: The modular Express/TypeScript server architecture established for the SPACE. furniture e-commerce app.
---

## Architecture

```
server/
├── index.ts          # Lean entry: load env → bootstrap → listen + graceful shutdown
├── app.ts            # Express factory: trust proxy, helmet, cors, session, rate-limit, routes, error handler
├── config/
│   ├── env.ts        # Zod env validation — exits process on invalid config
│   ├── logger.ts     # Pino structured logger with sensitive-field redaction
│   ├── session.ts    # PostgreSQL-backed express-session store
│   └── telemetry.ts  # Optional-exporter OpenTelemetry setup and shutdown
├── middleware/
│   ├── auth.ts       # requireAuth (session.userId guard), requireAdmin
│   ├── errorHandler.ts  # ZodError → 400, AppError → statusCode, unknown → 500
│   └── rateLimiter.ts   # globalLimiter (300/15min), authLimiter (15/15min), apiLimiter (150/15min)
├── modules/
│   ├── auth/         # auth.router.ts + auth.service.ts (bcryptjs, SafeUser no password)
│   ├── products/     # products.router.ts + products.service.ts
│   └── cart/         # cart.router.ts + cart.service.ts (merge on duplicate, ownership check)
├── db/
│   ├── client.ts     # Prisma singleton with PrismaPg adapter
│   └── seed.ts       # Idempotent seed (checks product count before seeding)
└── utils/
    ├── errors.ts     # AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError
    └── asyncHandler.ts  # Wraps async route handlers, forwards rejections to Express error middleware
```

## Key decisions
- **bcryptjs** (not bcrypt) — pure JS, avoids native bindings in NixOS.
- **SafeUser** type — password field never returned from any auth endpoint.
- **Session-based auth** — express-session + PostgreSQL store (no in-memory session state).
- **Shared schema** — pure Zod types in shared/schema.ts, no Drizzle dependency. Frontend uses these types.
- **Observability** — Pino is the only request/application logger; OpenTelemetry auto-instrumentation is enabled and exports only when an OTLP endpoint is configured.
- **Express 5 routing** — catch-all middleware uses function handlers rather than `*` route strings, which are no longer valid with Express 5's path parser.
- **Idempotent seed** — checks `db.product.count()` before seeding; safe to run multiple times.
- **Deprecated files** — server/routes.ts, server/storage.ts, server/db.ts kept as empty stubs to avoid import errors.

**Why:** Separation of concerns, testability, rate limiting per route category, structured logging for observability.
