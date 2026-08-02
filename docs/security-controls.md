# Security & Health Controls — What They Are and How Not To Break Them

Onboarding reference for the perimeter work merged in `05fa80d..9b47297`
(branch `feat/auth-hardening-and-health-checks`).

Read this before touching authentication, the tenant scoping layer, the health
endpoints, or the integration test harness. Several of the controls below look
redundant or over-cautious until you know the failure they exist to prevent, and
each has already been "helpfully simplified" at least once during development.

---

## 1. The six controls and where they live

| # | Control | Implementation | Proof |
|---|---|---|---|
| 1 | **Tenant isolation** | `backend/src/config/tenant-db.ts` — a Prisma `$extends` that injects `where: { schoolId }` for every model in `SCOPED_MODELS`, with the current tenant carried in AsyncLocalStorage | `backend/test/integration/isolation.integration.test.ts` |
| 2 | **Login rate limiting** | `backend/src/middlewares/rate-limit.middleware.ts`, mounted in `backend/src/routes/auth.routes.ts` | `backend/test/integration/rate-limit.integration.test.ts`, `backend/src/middlewares/rate-limit.middleware.spec.ts` |
| 3 | **Client IP in audit rows** | `backend/src/config/trust-proxy.ts`, applied in `app.ts` before any middleware reads `req.ip` | `backend/src/config/trust-proxy.spec.ts` |
| 4 | **Liveness / readiness** | `backend/src/services/health.service.ts`, `backend/src/routes/health.routes.ts` | `backend/src/services/health.service.spec.ts`, plus probes in `docker-compose.yml`, `k8s/*.yaml`, `.github/workflows/cd.yml` |
| 5 | **RBAC guard matrix** | `authorize()` applied at the router-mount level in `backend/src/app.ts` | `backend/test/integration/rbac.integration.test.ts` |
| 6 | **Security headers** | `helmet` in `app.ts` (API responses), `frontend/next.config.ts` (HTML + static) | `backend/test/integration/harness.integration.test.ts` |

---

## 2. Invariants you must not break

Each of these has a specific failure behind it. If a change requires breaking
one, that is a design discussion, not a refactor.

### `/healthz` must never check a dependency

Liveness failure **restarts the pod**. If `/healthz` checked Postgres, a brief
database blip would fail liveness on every replica simultaneously, Kubernetes
would restart the entire fleet, and the restart storm would prevent the database
recovering. `/readyz` checks dependencies because readiness failure only removes
a replica from the load balancer.

`/healthz` returning a bare `{"status":"ok"}` is the finished state, not a stub.

### `trust proxy` is a hop count, never `true`

`app.set("trust proxy", true)` trusts any client-supplied `X-Forwarded-For`,
which lets an attacker choose the IP written to the audit log **and** evade the
per-IP rate limiter by rotating a header. The hop count (`TRUST_PROXY_HOPS`)
means Express reads the *nth entry from the right*, which only a proxy we operate
controls. Unparseable values fall back to `0` — wrong, but not forgeable.

Compose runs nginx (`1`). Kubernetes has no proxy at all (`0`).

### The rate limiter fails closed

If Redis is unavailable, auth requests get 503 rather than silently losing the
control. This is coherent with `/readyz`: a replica whose Redis is down already
reports NotReady and leaves rotation, so failing closed strands nobody who was
not already cut off. `passOnStoreError: true` would make it fail *open* — do not
set it.

### Audit writes are best-effort and must never be awaited on the request path

`auditService.record` swallows its own errors by design. The rate limiter calls
it with `void` deliberately: awaiting a database write on every blocked request
would add synchronous latency to the path already absorbing a brute-force attack.

### The rate-limit audit flag must not share a namespace with the limiter's store

`auth.rate_limited` rows are written **once per limiter key per window**, gated by
a Redis `SET NX PX` flag prefixed `audit:`. That prefix is load-bearing: the first
implementation reused `RedisStore`'s own key namespace, so `SET NX` always found
the existing hit counter and **no audit row was ever written at all** — silently
worse than the write amplification it replaced, and invisible to every test that
asserts on the 429 rather than the row.

### The auth limiters must not publish `RateLimit-*` headers

`standardHeaders`/`legacyHeaders` are off on the auth limiters. With them on,
`POST /api/auth/login` returned `RateLimit-Limit: 5` / `RateLimit-Remaining` to
unauthenticated callers for any email they named — letting an attacker pace just
below the threshold and observe whether an account is locked. `Retry-After` is set
by hand in `onBlocked` because it is the one signal a legitimate user needs.

### Cross-tenant reads return 404, not 403

403 confirms the row exists. 404 leaks nothing about another tenant's data.

### nginx must not add security headers

`nginx.conf` deliberately sets none. Headers come from the applications so they
survive in the Kubernetes topology, which has no nginx and no Ingress. When both
layers set them, `Referrer-Policy` conflicted — helmet's `no-referrer` versus
nginx's `strict-origin-when-cross-origin`, with the browser taking the last token,
so the proxy silently overrode the stricter application policy.

`Referrer-Policy` intentionally differs by response class: `no-referrer` on the
API, `strict-origin-when-cross-origin` on HTML. Both are chosen, not defaulted.

### Authorization lives at the router mount — with one exception

`authorize()` runs once per mount in `app.ts` and applies to every verb and
sub-path beneath it. The sole exception is `POST /api/auth/invites`, which
declares its own chain inside `auth.routes.ts` because the `/api/auth` mount must
stay unguarded for login, refresh, logout and setup-password.

That exception is why the RBAC matrix covers it separately. A route added to
`auth.routes.ts` that needs a guard will **not** inherit one.

---

## 3. Running the tests

```bash
npm run test --workspace backend              # unit — 36 tests, ~1s, no containers
npm run test:integration --workspace backend  # integration — 79 tests, ~70s warm
```

The two suites are separate Vitest projects on purpose (`vitest.config.ts` globs
`src/**`, `vitest.integration.config.ts` globs `test/integration/**`). Keep the
globs disjoint or the fast suite silently becomes container-dependent.

**Integration harness notes:**

- Testcontainers starts a real Postgres and Redis per run. The Postgres image must
  be `timescale/timescaledb-ha:pg17` — migrations create PostGIS `geography`
  columns and a TimescaleDB hypertable that a stock `postgres:*` image cannot
  apply.
- `fileParallelism: false` is required. Every test file `TRUNCATE`s the shared
  database in its setup; without it, files interleave and corrupt each other's
  fixtures. `singleThread: true` alone does **not** prevent this — it caps worker
  count, not file scheduling.
- Tests authenticate through the real `POST /api/auth/login`. Hand-minted JWTs
  would skip the middleware chain that is the subject of the tests.
- `loadApp()` imports the app dynamically. `config/prisma.ts` reads `DATABASE_URL`
  at module load and dotenv does not override an already-set variable, so a static
  top-level import would silently point the suite at your dev database.
- `loginAs()` writes a real `auth.login` audit row per call. Any test asserting
  audit-row *counts* must account for its own logins.
- Suites that log in repeatedly call `redisClient.flushDb()` in `beforeEach`,
  because their own login volume otherwise exhausts the per-IP budget mid-file.

---

## 4. Traps already hit — do not rediscover these

| Symptom | Cause |
|---|---|
| Second login within the same second returns 409 | Identical JWT payload + second-resolution `iat` produced byte-identical refresh tokens colliding on `RefreshToken.tokenHash`. Fixed with `jwtid` in `createRefreshToken`. |
| Audit `ip` column shows the same internal address for every request | No `trust proxy`, so `req.ip` was the nginx container. |
| `Referrer-Policy` weaker than expected on API responses | nginx overriding helmet (see above). |
| No `auth.rate_limited` rows despite blocks firing | Redis dedup flag colliding with the limiter's own key namespace. |
| Integration tests fail with 429 partway through | Per-IP budget exhausted by the suite's own `loginAs()` calls. |
| A rate-limit demo returns 429 on the *first* request | An earlier run locked the account; the window is 15 minutes. `docker compose exec redis redis-cli FLUSHDB`. |
| Code changes appear to have no effect in Docker | Backend and frontend images bake source at build time — there is no volume mount. Rebuild: `docker compose up -d --build backend`. |

---

## 5. Known residuals

Deliberately not fixed, with the reasoning:

- **Audit dedup window offset.** The dedup flag's TTL starts at first-block time,
  not window-start, so under a slow paced attack a block in a new window can go
  unlogged. Under-logs only; never amplifies, never suppresses a 429.
- **Per-account lockout is a DoS vector.** Anyone knowing an admin's email can
  lock it for 15 minutes. The short window *is* the mitigation — a sticky lock
  would need manual clearing, and removing per-account limiting would let a
  distributed botnet stuff one account from rotating IPs.
- **Per-IP budget of 20/15min** may be tight for an office behind a single NAT.
- **`/readyz`'s 503 path has no automated test** — verified manually.
- **No Row-Level Security.** App-layer scoping plus the isolation suite is the
  current defence. Revisit when the Phase 2 ingest path introduces raw SQL that
  bypasses the Prisma extension.
- **Dependency vulnerabilities.** `npm audit --omit=dev` reports issues in shipped
  dependencies. These predate this work. Do not describe them as dev-only.

---

## 6. Where the reasoning lives

- **Threat model, decisions, and what was deliberately cut** —
  `docs/superpowers/specs/2026-08-02-phase-1.5-perimeter-hardening-design.md`
- **Task-by-task implementation plan** —
  `docs/superpowers/plans/2026-08-02-phase-1.5-perimeter-hardening.md`
- **Runnable demonstration of all six controls, with the questions to expect** —
  `docs/demo-script.md`

The demo script is the fastest way to see every control working: it breaks each
one deliberately and shows the system noticing.
