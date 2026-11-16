# GuardianWay target database foundation

This PR adds an independently deployable target schema: 41 domain tables, 530 columns and 182 foreign keys. It does not activate this schema in the existing application.

## Ownership

- `backend/prisma/` and `backend/prisma.config.ts`: existing application schema/migrations, unchanged.
- `backend/database-schema/`: target model, independent migration history, fictional seed and write-target guard.
- `backend/prisma.database.config.ts`: opt-in target config using SCHEMA_DATABASE_URL; never falls back to the application's DATABASE_URL.
- `backend/generated/database-client/`: separate generated client (ignored). Application imports of @prisma/client stay on the existing schema.

No dependency upgrades, API/FE changes or application cutover are included. Adapting the backend and activating the new model are follow-up work.

## Validate and test

After installing workspace dependencies, at repository root:

```powershell
$env:SCHEMA_DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/guardianway_schema_test'
npm run database-schema:validate --workspace backend
npm run database-schema:generate --workspace backend
npm run test:database-schema --workspace backend
```

Validate/generate use the illustrative URL without connecting to a database. Tests create their own TimescaleDB/PostGIS container with random host ports, plus test/demo/shadow databases inside that container. They do not use the persistent development database or application volumes. Docker must be running. Migration, generated geography, unique/FK/CHECK behavior, ORM date/time/JSONB, seed repeatability and drift are tested.

Primary and shadow URLs must not contain query strings. An explicitly configured `SCHEMA_SHADOW_DATABASE_URL` must use the dedicated local `guardianway_schema_shadow` database and must not resolve to the primary database. Credentials, loopback aliases and default-port spelling do not make a database distinct. No shadow URL means Prisma retains its normal automatic temporary-shadow behavior.

The new CI job only generates this separate client. Existing application CI jobs continue to generate backend/prisma/schema.prisma as before.

## Optional persistent development instance

Copy `database/.env.example` to `database/.env`, set a local password and update the URL to match. Do not overwrite credentials for an already initialized volume.

```powershell
docker compose -f docker-compose.database.yml up -d --wait
node node_modules/prisma/build/index.js migrate deploy --config backend/prisma.database.config.ts
node node_modules/prisma/build/index.js migrate status --config backend/prisma.database.config.ts
```

This starts one PostgreSQL 17 instance with TimescaleDB/PostGIS, on 127.0.0.1:55432, with a separate named volume. It does not create an HA cluster or start the application. The existing docker-compose.yml and application DATABASE_URL are unchanged. Check port/container-name availability before starting an additional instance.

Persistent data is not seeded automatically. To add fictional examples explicitly:

```powershell
node node_modules/prisma/build/index.js db seed --config backend/prisma.database.config.ts
```

The seed contains 58 fictional records, both directions, a reconciled morning trip and a planned afternoon trip. It has no usable login credentials, no real push token and no provider calls. Distances, solver input and policy thresholds are illustrative, not production defaults. Re-running seed preserves existing rows instead of overwriting history.

## Constraints and maintenance

Status/domain values are text; the future backend must validate their vocabulary and transitions. Business foreign keys enforce school context, while actor identity references still require backend authorization. UUIDs do not grant access.

GPS uses PK(measured_at,id), a seven-day hypertable chunk, generated geography from longitude/latitude and no automatic retention/compression. ID alone is not globally unique. A retry must preserve its key/payload; endpoint-level authorization and idempotency are follow-up backend work.

Codes/plates are unique among nondeleted records within a school; email stays unique after soft deletion. Normalization belongs to application write paths. Partial uniqueness on open rows does not prove all closed historical intervals are disjoint. Version/context and reconciliation rules not expressed by FK/unique/CHECK must be implemented transactionally in the backend.

SQL owns CHECK, partial unique/index and hypertable/generated-column features that Prisma cannot fully describe. Review future generated migrations; do not use db push. Tests verify history replay and an empty ORM diff in addition to actual SQL behavior. Prisma manages updated_at; direct SQL updates must set it explicitly.
