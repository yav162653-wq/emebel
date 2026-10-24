#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")/.."

npm ci --no-audit --no-fund
npm run db:push
npx prisma generate
npm run check
npm test
npm run build
