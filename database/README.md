# Local application database

`docker-compose.database.yml` starts PostgreSQL 17 with TimescaleDB/PostGIS in the separate guardianway_schema_pgdata volume. It does not modify the old application volume.

Host: 127.0.0.1:55432. Database: guardianway_dev. User: gw. Copy .env.example only when creating a new local configuration; preserve credentials for an initialized volume. Actual credentials stay in the ignored database/.env file.

The sole application schema/config is backend/prisma/schema.prisma and backend/prisma.config.ts. SCHEMA_DATABASE_URL is consumed by the guarded local runner and passed to child processes as DATABASE_URL/DIRECT_URL. Production and CI use explicit DATABASE_URL independently of the local guard.

At repository root:

```powershell
docker compose -f docker-compose.database.yml up -d --wait
npm run database:migrate:demo --workspace backend
npm run database:seed:demo --workspace backend
npm run dev --workspace backend
```

Seed requires explicit bootstrap credentials; see backend/prisma/README.md. It is separate from the fictional SQL test fixture. It preserves existing accounts/passwords/history. No migration command resets an existing volume or converts legacy data. Worktrees must use their own ignored env files or explicit GUARDIANWAY_APP_ENV_FILE/GUARDIANWAY_SCHEMA_ENV_FILE paths.
