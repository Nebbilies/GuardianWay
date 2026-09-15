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

Copy the backend example file:

```bash
cp backend/.env.example backend/.env
```

On PowerShell, use `Copy-Item backend/.env.example backend/.env` instead.

For development outside Docker, update these values in `backend/.env`:

```dotenv
DATABASE_URL="postgresql://gw:gw_pw@localhost:5432/guardianway"
DIRECT_URL="postgresql://gw:gw_pw@localhost:5432/guardianway"
REDIS_URL="redis://localhost:6379"
WEB_BASE_URL="http://localhost:3000"
TRUST_PROXY_HOPS=0
```

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

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 4. Prepare the database

```bash
npm exec --workspace backend -- prisma generate
npm exec --workspace backend -- prisma migrate deploy
npm run seed --workspace backend
```

The seed is safe to run more than once. It creates two sample schools and a
platform administrator:

- Email: `superadmin@guardianway.vn`
- Password: `Password123!`

These credentials are for local development only.

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
docker compose stop postgres redis
```

To run the production-like container stack after initializing the database,
restore the Docker service hostnames from `backend/.env.example`, then run:

```bash
docker compose up --build
```

The proxied application is available at
[http://localhost:8080](http://localhost:8080).

## License

GuardianWay is available under the [MIT License](LICENSE).
