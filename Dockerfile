FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=optional

FROM dependencies AS build
COPY . .
RUN MIGRATION_DATABASE_URL=postgresql://localhost/emebel npx prisma generate \
    && npm run build

FROM build AS migrate
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*
USER node
CMD ["sh", "-ec", "npx prisma migrate deploy && npx prisma migrate status && psql \"${MIGRATION_DATABASE_URL%%\\?*}\" -v ON_ERROR_STOP=1 -f prisma/role-grants/runtime-grants.sql"]

FROM build AS production-dependencies
RUN npm prune --omit=dev --include=optional

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/index.cjs"]
