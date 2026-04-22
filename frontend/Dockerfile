# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app

FROM base AS deps
ENV NODE_ENV=development

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY shared/package.json ./shared/package.json
RUN --mount=type=cache,target=/root/.npm npm ci --workspace frontend --workspace shared --include-workspace-root=false
RUN npm install --workspace frontend lightningcss-linux-arm64-musl@1.31.1 lightningcss-linux-x64-gnu@1.31.1 lightningcss-linux-x64-musl@1.31.1 @tailwindcss/oxide-linux-x64-musl@4.2.1 --save-optional

FROM deps AS build
ENV NODE_ENV=production
COPY frontend ./frontend
COPY shared ./shared
WORKDIR /usr/src/app/frontend
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

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