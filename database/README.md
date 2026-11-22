# Local database

Run these commands from the repository root with Docker running and workspace dependencies installed.

1. For a new checkout, copy [database/.env.example](.env.example) to `database/.env` and [backend/.env.example](../backend/.env.example) to `backend/.env`.
2. Set `POSTGRES_PASSWORD` and use the same password in `SCHEMA_DATABASE_URL`. The default database is `guardianway_dev` at `127.0.0.1:55432`. Keep the raw password in `POSTGRES_PASSWORD` and percent-encode reserved characters in the URL password (e.g. `/` becomes `%2F`). For an existing volume, use its current credentials.
3. Configure the accounts you want in `backend/.env` using the [demo seed settings](../backend/prisma/README.md#demo-seed).

```sh
docker compose -f docker-compose.database.yml up -d --wait
npm run database:generate --workspace backend
npm run database:migrate:demo --workspace backend
npm run database:seed:demo --workspace backend
```
