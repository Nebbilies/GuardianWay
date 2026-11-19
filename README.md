# GuardianWay

GuardianWay is a multi-school platform for managing school transportation and
student safety. It gives platform operators and school administrators a shared
place to manage schools, users, students, buses, stops, routes, and trips, with
tenant-aware access control and audit logging.

The current repository contains the web administration portal and REST API.
Real-time GPS tracking, boarding events, notifications, and the parent/driver
mobile experience are planned as later product phases.

## Technology

- **Web:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **API:** Express 5, TypeScript, Prisma
- **Data:** PostgreSQL 17 with TimescaleDB, Redis 7
- **Operations:** Docker Compose, Nginx, Kubernetes, GitHub Actions

## Repository layout

| Path | Purpose |
| --- | --- |
| `frontend/` | Next.js website and administration portal |
| `backend/` | Express API, Prisma schema, migrations, and seed data |
| `shared/` | Types and utilities shared by the frontend and backend |
| `mobile/` | Reserved for the parent and driver mobile application |
| `k8s/` | Kubernetes manifests |
| `monitoring/` | Prometheus, Grafana, Loki, and related configuration |
| `docs/` | Architecture, security, real-time, and delivery documentation |

## Local development

### Prerequisites

- Node.js 22
- npm
- Docker with Docker Compose

### 1. Install dependencies

From the repository root:

```bash
npm ci
```

### 2. Configure the environment

Copy `backend/.env.example` to `backend/.env` and `database/.env.example` to `database/.env` for a new development checkout. Preserve existing credentials when reusing a database volume. Set the PostgreSQL password and matching loopback connection URL in the database file. The guarded dev commands read both files. Set `REDIS_ENABLED=false`, `WEB_BASE_URL=http://localhost:3000` and `TRUST_PROXY_HOPS=0` in the backend file for host development.

Replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with separate random
values. This cross-platform Node.js command generates one value:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice and keep the generated values private. Configure
`EMAIL_USERNAME` and `EMAIL_PASSWORD` only when testing invitation emails.

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Start the dedicated demo database

```bash
docker compose -f docker-compose.database.yml up -d --wait
```

### 4. Prepare the database

Set `BOOTSTRAP_PLATFORM_EMAIL` and `BOOTSTRAP_PLATFORM_PASSWORD` in the backend environment. For an additional school administrator, set both `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`. Use passwords of at least 12 characters and at most 72 UTF-8 bytes. Existing passwords are preserved.

```bash
npm run database:generate --workspace backend
npm run database:migrate:demo --workspace backend
npm run database:seed:demo --workspace backend
```

### 5. Start the applications

Run each command in a separate terminal from the repository root:

```bash
npm run dev --workspace backend
```

```bash
npm run dev --workspace frontend
```

Open the web app at [http://localhost:3000](http://localhost:3000). The API runs
at [http://localhost:8000](http://localhost:8000), with health checks at
`/healthz` and `/readyz`.

### Useful commands

```bash
# Type checking
npm run typecheck --workspace backend
npm run typecheck --workspace frontend

# Tests
npm test --workspace backend
npm test --workspace frontend

# Frontend linting
npm run lint --workspace frontend
```

To stop the local data services:

```bash
docker compose -f docker-compose.database.yml stop
```

The full Compose stack uses its own database and volume. In `backend/.env` set `DATABASE_URL` and `DIRECT_URL` to the Compose PostgreSQL service, for example `postgresql://gw:gw_pw@postgres:5432/guardianway`, set `REDIS_ENABLED=true`, `REDIS_URL=redis://redis:6379` and `WEB_BASE_URL=http://localhost:8080`. Initialize a fresh Compose database before starting the application. The legacy database is not a migration target.

```bash
docker compose up -d postgres redis
docker compose run --rm --build backend npm run database:migrate
docker compose up --build
```

The proxied application is available at
[http://localhost:8080](http://localhost:8080).

## License

GuardianWay is available under the [MIT License](LICENSE).
