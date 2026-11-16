# Optional target PostgreSQL instance

`docker-compose.database.yml` creates a single PostgreSQL 17 instance with TimescaleDB/PostGIS. It uses `guardianway_schema_pgdata`, not the existing application volume.

Host connection: 127.0.0.1:55432, database guardianway_dev, user gw. Local credentials live in database/.env (ignored); .env.example is a template, not a real secret. No credentials from another checkout are included.

Only backend/prisma.database.config.ts uses SCHEMA_DATABASE_URL from this file. The application's Prisma config and runtime DATABASE_URL are unchanged. Migration/seed instructions and validation boundaries are in backend/database-schema/README.md.
