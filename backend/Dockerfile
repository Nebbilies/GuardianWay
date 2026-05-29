# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS base
WORKDIR /usr/src/app

FROM base AS deps
ENV NODE_ENV=development

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
COPY backend/prisma ./backend/prisma
RUN --mount=type=cache,target=/root/.npm npm ci --workspace backend --workspace shared --include-workspace-root=false

FROM deps AS build
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY shared/index.ts ./shared/index.ts
COPY shared/types ./shared/types
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres" npm exec --workspace backend prisma generate -- --schema prisma/schema.prisma
RUN npm run build --workspace backend

FROM base AS runtime
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --workspace backend --workspace shared --include-workspace-root=false
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres" npm exec --workspace backend prisma generate -- --schema prisma/schema.prisma

COPY --chown=node:node --from=build /usr/src/app/backend/dist ./backend/dist
COPY --chown=node:node --from=build /usr/src/app/shared ./shared

WORKDIR /usr/src/app/backend
USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/index.js"]
