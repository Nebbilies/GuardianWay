# GuardianWay application database

`schema.prisma`, `migrations/` and `../prisma.config.ts` are the sole application schema and migration history. The generated application client is `@prisma/client`; there is no second client or Prisma config.

The baseline has 41 domain tables, 530 SQL columns and 182 foreign keys. Its SQL retains SHA-256 FE2C43461B6AFD95A1031EC6C51075DED466C6E48D001580B244274D39B5DA87. A follow-up migration scopes six foreign keys by their route, trip, or attendance event. Status/domain columns are text; backend modules validate values and transitions. SQL retains integrity constraints, partial indexes, generated PostGIS geography and the measured_at GPS hypertable. This application PR does not implement GPS ingestion or trip execution.

## Generate, validate and test

At repository root, set DATABASE_URL to a syntactically valid PostgreSQL URL. Generate/validate do not connect. Runtime and production migration use the explicit DATABASE_URL supplied by the environment; no loopback-only demo guard is applied to them.

```powershell
npm run database:generate --workspace backend
npm run database:validate --workspace backend
npm run test:database-schema --workspace backend
npm run test:architecture --workspace backend
npm run test:integration --workspace backend
```

Docker must run for database and HTTP tests. They create disposable PostgreSQL/TimescaleDB/PostGIS and Redis containers. The backend integration suite exercises the HTTP provider. Leave SCHEMA_SHADOW_DATABASE_URL unset in deployments; only configure it for isolated migration-diff tests.

## Guarded local demo commands

Use `database/.env` for SCHEMA_DATABASE_URL and `backend/.env` for app configuration. Ignored files are not copied into worktrees. Set GUARDIANWAY_APP_ENV_FILE and GUARDIANWAY_SCHEMA_ENV_FILE in your shell before running npm when using files from a chosen checkout; the runner never searches parent directories. It overrides DATABASE_URL and DIRECT_URL with the validated target before starting the child process.

For local development without Redis, set `REDIS_ENABLED=false` in the app environment or PowerShell session. Authentication still uses rate limits backed by the installed library's in-memory store; counters and audit deduplication are local to the process and reset on restart. `/readyz` checks PostgreSQL and reports Redis as `disabled`. Redis remains enabled by default. Production rejects disabling Redis; an enabled but unavailable Redis still blocks authentication and fails readiness. Refresh tokens remain in PostgreSQL in both modes.

```powershell
npm run database:migrate:demo --workspace backend
npm run database:seed:demo --workspace backend
npm run dev --workspace backend
```

Migrate uses `migrate deploy`, never reset/db push. The local guard permits only the explicitly named loopback demo/test databases. Shadow URLs must name guardianway_schema_shadow and cannot resolve to the primary target. SQL fixtures live in `test/database-schema/fixtures/`; they test all 41 tables and do not create usable login credentials.

## Application bootstrap

Set BOOTSTRAP_PLATFORM_EMAIL and BOOTSTRAP_PLATFORM_PASSWORD (at least 12 characters and at most 72 UTF-8 bytes for either bootstrap password). Optionally set both DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD, plus DEMO_SCHOOL_CODE (default DEMO). The demo school is explicitly fictional, uses Asia/Ho_Chi_Minh, and starts without plans, thresholds, students or invented operational metrics. A code already in use can be reused only if the active school retains the demo name and address.

Passwords are bcrypt hashes. Re-running bootstrap preserves existing passwords, ownership and history. A conflicting owner or deleted account fails rather than being reassigned. Invitation mail requires configured EMAIL_USERNAME/EMAIL_PASSWORD; account creation reports SENT, FAILED or NOT_CONFIGURED after its transaction commits.

The old database and old application migrations are not upgrade targets for this new baseline. Select a new database URL before any deployment; no legacy data conversion or reset is performed by these commands. Access JWTs require contractVersion 2, so clients sign in again after cutover.
