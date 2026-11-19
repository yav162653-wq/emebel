# Contributing

## Setup

1. Install Node.js 20+ and PostgreSQL.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Configure a local PostgreSQL database.
5. Run `npm run db:migrate`.

## Validation

Run the relevant checks before submitting changes:

```powershell
npm run check
npm test
npm run build
```

Do not commit `.env` files, secrets, `node_modules`, build output, database dumps, or generated cache files.
