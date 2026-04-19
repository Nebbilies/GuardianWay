# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS base
WORKDIR /usr/src/app

FROM base AS deps
ENV NODE_ENV=development

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
COPY backend/prisma ./backend/prisma
RUN --mount=type=cache,target=/root/.npm npm ci --workspace frontend --workspace backend --workspace shared --include-workspace-root=false

FROM deps AS build
COPY frontend ./frontend
COPY backend/src ./backend/src
COPY backend/prisma.config.ts ./backend/prisma.config.ts
COPY shared ./shared
RUN npm exec --workspace backend prisma generate -- --schema prisma/schema.prisma
RUN npm run build --workspace frontend

FROM base AS runner
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --workspace frontend --workspace backend --workspace shared --include-workspace-root=false

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs --from=build /usr/src/app/frontend/public ./frontend/public
COPY --chown=nextjs:nodejs --from=build /usr/src/app/frontend/.next/standalone ./
COPY --chown=nextjs:nodejs --from=build /usr/src/app/frontend/.next/static ./frontend/.next/static

WORKDIR /usr/src/app/frontend
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]