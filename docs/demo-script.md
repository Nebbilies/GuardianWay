# GuardianWay — Phase 1.5 Demo Script

Six demonstrations, one per threat in the Phase 1.5 threat model. Each shows a
real defect being caught by the control that now exists.

## Setup (run before the demo, not during)

```bash
docker compose up -d --build
docker compose ps          # backend, frontend, postgres, redis show "healthy";
                            # nginx has no healthcheck defined, so it just shows "Up"

# REQUIRED, not optional — run this immediately before presenting, every time,
# even if you don't remember tripping the limiter recently. If you rehearsed
# Demo 2 at any point in the last 15 minutes (or ran any of the curl loops in
# this document, or the integration suite, against this stack), the demo
# account is still locked and you will not get a second chance to notice
# before walking into the room.
#
# Symptom if you skip this: Demo 2's very first curl in the loop already
# returns 429 — you see `429 429 429 429 429 429` instead of
# `401 401 401 401 401 429`, with no 401s at all. That is not the demo
# working, it is the demo starting from an already-tripped limiter. If you see
# that mid-defense, run the command below and re-run Demo 2's loop; don't
# improvise an explanation.
#
# Safe to run any time: this Redis instance holds nothing but rate-limit
# counters (checked across the whole codebase — no sessions, no cache, no
# queues live here today). Flushing it cannot affect any other demo.
docker compose exec redis redis-cli FLUSHDB
```

Seeded credentials (all with password `Password123!`):

| Email | Role |
|---|---|
| `admin@nguyendu.edu.vn` | ADMIN |
| `admin@lequydon.edu.vn` | ADMIN |
| `superadmin@guardianway.vn` | SUPER_ADMIN |

**Three things to know before you start:**

1. **Demo 2 deliberately locks an account for 15 minutes.** It uses
   `admin@nguyendu.edu.vn`. Demo 3 deliberately uses the *other* admin account
   (`admin@lequydon.edu.vn`) so it isn't affected by that lock and the demos can
   run straight through in order. If you rehearse Demo 2 more than once inside
   15 minutes, clear the counters again before the next attempt — same command
   as the mandatory setup step above: `docker compose exec redis redis-cli
   FLUSHDB`. Rehearsing is exactly how you end up needing the mandatory step,
   so get in the habit of running it after every rehearsal, not just before
   the real thing.
2. **The integration suite starts real Postgres and Redis containers**
   (Testcontainers), on top of the ones already running for the app. A warm run
   (images already pulled) takes **roughly 60–65 seconds**. Budget for that, or
   run it once before the defense and show that output if time is tight.
3. **`rate-limit.integration.test.ts` has a known, confirmed timing race** — not
   a flake in the sense of being unexplained. The limiter writes its audit row
   fire-and-forget (`void auditService.record(...)`) and responds before that
   write is guaranteed to land, while the test queries for the row immediately
   after. It has failed once and passed on an immediate re-run. A fix is planned
   separately. If Demo 1 or Demo 5's run happens to hit it, say so and re-run —
   don't debug it live.

---

## Demo 1 — T1: cross-tenant isolation is proven, not asserted

**Claim:** an admin of School A cannot read School B's data, and this is enforced
by a test rather than by inspection.

```bash
npm run test:integration --workspace backend
```

Expected: all 5 integration test files pass, **78 tests** total. The isolation
suite covers list scoping across all six tenant-scoped read surfaces (buses,
bus routes, bus stops, bus trips, students, audit logs), cross-tenant access by
id returning 404, forged `schoolId` in query and body, and unscoped
super-admin visibility.

**Then break it live.** Comment out `"Bus"` in `SCOPED_MODELS`
(`backend/src/config/tenant-db.ts`):

```ts
const SCOPED_MODELS = new Set<string>([
    "StudentProfile",
    // "Bus",
    "BusStop",
    ...
```

Re-run the same command. Expected: **exactly 4 tests fail**, all Bus-related —
the two `/api/buses` list-scoping tests, the cross-tenant bus-delete test, and
the forged-`schoolId`-on-buses test. Everything else (74 tests) still passes.
That precision is the point: the leak is confined to exactly the model that
lost its scoping, nothing else moves.

Restore the line and confirm with `git diff` that the file is back to zero net
change before moving on.

**Follow-up you should expect:** *"Why 404 and not 403?"*
A 403 confirms the row exists. 404 leaks nothing about another tenant.

## Demo 2 — T2: brute force is stopped, not merely logged

```bash
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:8080/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@nguyendu.edu.vn","password":"wrong"}'
done; echo
```

Expected: `401 401 401 401 401 429`.

Then open the audit viewer at `http://localhost:8080/admin/audit` and show the
`auth.rate_limited` row (`metadata.reason: "account"`). The block is visible in
the product, not just in a log.

**Follow-up:** *"Why two limiters?"* Per-IP alone is beaten by a botnet;
per-account alone lets one host enumerate many accounts.

**Follow-up:** *"Why is the email not in the Redis key?"* It is SHA-256'd, so the
rate-limit store holds no plaintext PII.

**Follow-up you should expect:** *"Can I lock out your admin just by knowing
their email?"* Yes — deliberately, and it was raised in review. The 15-minute
window *is* the mitigation: it is a cooldown, not a sticky lock, so it clears
itself without needing an admin to intervene. The alternative — no per-account
limiting — would let a distributed botnet credential-stuff a single known
account from rotating IPs, which is the exact attack this control exists to
stop. Per-IP limiting alone doesn't cover that (many IPs, one account); per-
account limiting alone doesn't cover the reverse (one IP, many accounts). Both
are needed together, and the nuisance-lockout trade-off was accepted rather
than missed.

## Demo 3 — T3: the audit log records who, from where

This uses `admin@lequydon.edu.vn` — the *other* admin account — so it isn't
affected by the lock Demo 2 just created.

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@lequydon.edu.vn","password":"Password123!"}' -o /dev/null

docker compose exec -T postgres psql -U gw -d guardianway -tAc \
  'select action, ip from "AuditLog" order by "createdAt" desc limit 1;'
```

Expected: `auth.login|<host address>` — the real client address, not
`::ffff:172.18.0.x` (the nginx container's own address). What that host address
looks like depends on your machine's Docker network; on the machine this
script was verified against it showed the Docker bridge gateway address
(`172.18.0.1`), not an nginx-internal one. The point to show is that it's
**not** the nginx container's IP — compare against `docker compose ps -q nginx`
+ `docker inspect` if challenged on this.

**Follow-up:** *"Why not `trust proxy: true`?"* That trusts any client-supplied
`X-Forwarded-For`, so an attacker picks the IP written to the audit log and
evades the per-IP limiter. A hop count (`TRUST_PROXY_HOPS=1` here) only trusts
the proxy we actually run.

**Volunteer this:** compose also publishes backend `:8000` directly for
development. A client reaching that port bypasses nginx and could forge the
header. Known, documented, and not present in the k8s topology (no nginx or
Ingress there at all).

## Demo 4 — T4: a broken deploy cannot report healthy

```bash
curl -s http://localhost:8000/readyz; echo
docker compose stop postgres
curl -s -o /dev/null -w 'readyz: %{http_code}\n'  http://localhost:8000/readyz
curl -s http://localhost:8000/readyz; echo
curl -s -o /dev/null -w 'healthz: %{http_code}\n' http://localhost:8000/healthz
docker compose ps backend
docker compose start postgres
```

Expected: `readyz` goes `200 {"status":"ok","checks":{"db":"ok","redis":"ok"}}`
→ `503 {"status":"fail","checks":{"db":"fail","redis":"ok"}}`. `healthz` stays
`200` throughout. The backend container's `docker compose ps` status flips to
`unhealthy` — this takes about 40–50 seconds after Postgres stops (Docker's
healthcheck needs 5 consecutive failed probes at a 10s interval), so don't run
`docker compose ps backend` immediately after stopping Postgres or it will
still read healthy. Restart Postgres and it recovers within about the same
window.

**This is the important beat.** `/healthz` staying up while `/readyz` fails is
the liveness/readiness distinction made visible.

**Follow-up:** *"Why doesn't liveness check the database?"* Because a failing
liveness probe restarts the pod. One database blip would fail liveness on every
replica at once, and the restart storm would prevent the database recovering.
Readiness only removes a replica from the load balancer, so it is the right
place for a dependency check.

**Follow-up:** *"What actually catches this in CI/CD?"* Not the smoke test —
that's a common misconception because it runs last and looks like the safety
net. Look at `.github/workflows/cd.yml`: `kubectl rollout status
deploy/backend --timeout=120s` runs *before* the smoke-test step, and it blocks
on the same `/readyz`-gated pod readiness this demo just exercised (see
`k8s/backend.yaml`'s `readinessProbe`). A backend that can't reach its database
never reports Ready, so `rollout status` times out and fails the job — the
smoke test's `curl -sf http://backend:8000/readyz` never even executes. The
smoke test is a secondary, redundant check for this specific failure mode;
its real job is catching things the readiness probe wouldn't (wrong route,
wrong port, frontend serving nothing).

## Demo 5 — T5: no route can lose its guard silently

```bash
npm run test:integration --workspace backend
```

Show the RBAC matrix section: 8 mounted routes × 5 actor classes (anonymous,
parent, driver, admin, superAdmin) is the bulk of it, plus dedicated coverage
for `POST /api/auth/invites`, whose guard lives on the route itself rather than
on an `app.ts` mount (the `/api/auth` mount is deliberately unguarded so
login/refresh/logout/setup-password stay public).

**Then break it live.** Remove `authorize(["SUPER_ADMIN", "ADMIN"])` from the
`/invites` route in `backend/src/routes/auth.routes.ts`:

```ts
router.post(
    "/invites",
    authenticate,
    // authorize(["SUPER_ADMIN", "ADMIN"]),   <-- removed
    validate({body: issueInviteBodySchema}),
    asyncHandler(authController.issueInvite),
);
```

Re-run. Expected: **exactly 2 tests fail** —
`forbids parent with 403` and `forbids driver with 403` — both with
`AssertionError: expected 404 to be 403`. That 404 is the tell: it means the
request reached the controller at all, i.e. it cleared authorization
completely on an admin-invite endpoint. Everything else still passes (76 of
78).

Restore the line and confirm with `git diff` that the file is back to zero net
change before moving on.

**Say this:** this is not hypothetical. `/api/schools` was mounted without
`tenantContext` earlier in this project, producing audit rows with no actor at
all. This matrix is the regression test for that class of bug.

## Demo 6 — T6: security headers

```bash
curl -sI http://localhost:8080/ | grep -iE 'x-frame|x-content|referrer|content-security'
```

Expected:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

**Be ready for:** *"Is nginx setting these?"* No — `nginx.conf` sets none of
them; the comment block in it says so explicitly. This request went through
nginx to Next.js, and it's `frontend/next.config.ts`'s `headers()` function
emitting them. Prove the split by hitting the API through the same proxy and
comparing:

```bash
curl -sI -X POST http://localhost:8080/api/auth/logout | grep -iE 'x-frame|x-content|referrer|content-security'
```

Expected (header order may vary slightly by response, the values are what
matter):

```
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

No CSP header here at all — the API serves JSON only, so `helmet()` is
configured with `contentSecurityPolicy: false` in `backend/src/app.ts`; CSP
belongs on HTML. And the `Referrer-Policy` value itself differs by design:
`no-referrer` on the API (a JSON endpoint never needs to leak a referrer) vs
`strict-origin-when-cross-origin` on HTML (ordinary same-origin navigation in
the portal depends on the referrer). Both values are chosen per response
class, not defaulted, and this is why headers moved out of nginx in the first
place — one nginx config can't tell these two response classes apart, and this
setup also has to survive the k8s topology, which has no nginx or Ingress in
front of the apps at all.

**Follow-up:** *"Why report-only?"* Enforcing against the Next.js App Router
requires nonce wiring or `unsafe-inline`. A CSP weakened until the app loads
proves nothing, so this measures first.

**Follow-up:** *"Why no HSTS?"* No TLS terminates anywhere in this topology.
Asserting HSTS would be a claim the deployment cannot honour.

---

## Deliberately out of scope — have these answers ready

| Not built | Answer |
|---|---|
| Row-Level Security | App-layer scoping (the Prisma extension) plus the isolation suite from Demo 1. RLS is the DB-level backstop for when Phase 2's ingest path introduces raw SQL that bypasses that extension. |
| Database backups | The k8s cluster is created and destroyed per push and the database is seeded per run. Designed, not implemented, because there is no persistent state to protect yet. |
| Password self-service | Another admin re-issues the invite. The invite machinery is already single-use, hashed and expiring. |
| Graceful shutdown | Real gap. No persistent traffic to drain in this topology, so it was deprioritised rather than missed. |
| Enforced CSP | See Demo 6. |
