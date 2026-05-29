# GuardianWay CI/CD Pipeline

This document explains how GuardianWay is tested, built, and deployed automatically with GitHub Actions. It is written
as a learning reference: each section explains *what* happens and *why* it exists, not just the commands. For one-line
definitions of any term, see [glossary.md](./glossary.md).

---

## 1. Overview

Two workflows live in `.github/workflows/`:

- **`ci.yml` — the quality gate.** Runs on every pull request and on pushes to `main`. Proves the code is correct (lint,
  types, tests, build) *before* it can merge. Ships nothing.
- **`cd.yml` — the delivery pipeline.** Runs only on pushes to `main`. Builds container images, pushes them to a
  registry (GHCR), then proves they actually deploy and run by standing up a throwaway Kubernetes cluster and
  smoke-testing it.

```
 Pull Request ──────────────► CI (ci.yml)
                              ├── lint
                              ├── typecheck      4 parallel jobs.
                              ├── test           All must pass
                              └── build          to allow merge.
                                   │
                                   ▼
 Merge to main ───────────► CI (re-verify main)
                       └──► CD (cd.yml)
                              │
                  build-and-push ── build backend + frontend images
                              │      push both to GHCR (:sha and :latest)
                              ▼
                          deploy ── create ephemeral kind cluster
                                     build 3 images (incl. gw-migrate)
                                     load images into kind
                                     apply namespace + secret
                                     apply postgres + redis  (wait ready)
                                     run prisma-migrate Job   (wait complete)
                                     apply backend + frontend (wait ready)
                                     smoke test both Services (HTTP 200)
                                     ── cluster discarded when job ends ──
```

---

## 2. CI vs CD

|              | `ci.yml`                                        | `cd.yml`                                     |
|--------------|-------------------------------------------------|----------------------------------------------|
| **Trigger**  | `pull_request` + `push` to `main`               | `push` to `main` only                        |
| **Purpose**  | Block bad code from merging                     | Build, publish, and prove the deploy         |
| **Produces** | A pass/fail signal                              | Container images in GHCR + a verified deploy |
| **Jobs**     | `lint`, `typecheck`, `test`, `build` (parallel) | `build-and-push` → `deploy` (sequential)     |

CI runs on the PR so a reviewer (and branch protection) can require green checks before merge. The same CI runs again on
`main` after merge as a final re-verification. CD only fires once code is on `main` — we never deliver from an unmerged
branch.

---

## 3. The four CI jobs

Every job runs on its own fresh `ubuntu-latest` runner VM, checks out the code, installs Node 22 with an npm cache, and
runs `npm ci`. They have no `needs:` between them, so they run **in parallel** — the whole gate finishes as fast as its
slowest job.

| Job         | Command(s)                                                   | What it proves                                             |
|-------------|--------------------------------------------------------------|------------------------------------------------------------|
| `lint`      | `npm run lint --workspace frontend`                          | Code style / ESLint rules pass (no errors)                 |
| `typecheck` | `prisma generate` then `tsc --noEmit` on backend + frontend  | Types are sound — no `any`-shaped surprises at runtime     |
| `test`      | `prisma generate` then `vitest run` on backend + frontend    | Unit/component tests pass (mapper logic, Button rendering) |
| `build`     | `prisma generate` then `npm run build` on backend + frontend | Production build compiles cleanly                          |

`prisma generate` appears in three of the four jobs because the generated Prisma client provides the TypeScript types
that typecheck, test, and build all depend on. `lint` is the only one that doesn't need it.

If any job fails, the PR shows a red check. With branch protection enabled on `main`, that red check makes merge
impossible — "CI is green" becomes a hard requirement, not a suggestion.

---

## 4. Images and GHCR

A **registry** stores built container images, addressed by name and tag. We use **GHCR** (GitHub Container Registry,
`ghcr.io`). A Kubernetes cluster is the **orchestrator** that *runs* those images. Registry stores; orchestrator runs —
different jobs.

The `build-and-push` job builds and publishes two images, each tagged twice:

| Image         | Tags                   | Built from                               |
|---------------|------------------------|------------------------------------------|
| `gw-backend`  | `:<sha>` and `:latest` | `backend/Dockerfile`, `--target runtime` |
| `gw-frontend` | `:<sha>` and `:latest` | `frontend/Dockerfile`                    |

- **`:<sha>`** (first 12 chars of the commit SHA) is **immutable** — it always points at the exact code that built it.
  This is what we deploy.
- **`:latest`** is a **moving pointer** to the newest build — convenient, but ambiguous (it changes), so never used to
  pin a deploy.

The job authenticates with `GITHUB_TOKEN` (auto-minted per run) plus the `packages: write` permission. GHCR owner paths
must be lowercase, so the workflow lowercases the owner with `${GITHUB_REPOSITORY_OWNER,,}`.

Principle: **build once, promote the artifact.** The image built here is the thing that ships; the deploy step reuses
the same `:<sha>` tag rather than rebuilding different code.

---

## 5. The kind deploy

The `deploy` job (`needs: build-and-push`) proves the images actually run. It uses **kind** (Kubernetes-in-Docker) to
spin up a real but throwaway cluster *inside the runner*.

**Three images, built locally for the cluster:**

| Image         | Stage              | Why                                                              |
|---------------|--------------------|------------------------------------------------------------------|
| `gw-backend`  | `--target runtime` | Lean production API image                                        |
| `gw-frontend` | (final stage)      | The web app                                                      |
| `gw-migrate`  | `--target build`   | Has the Prisma CLI + schema + migrations to run `migrate deploy` |

The backend *runtime* image is built with `--omit=dev`, so it has **no Prisma CLI** — it can't run migrations. The
*build* stage does, so we reuse it as `gw-migrate`. It is **never pushed to GHCR**; it exists only for the migrate Job
inside kind.

`kind load docker-image` injects each locally-built image straight into the cluster's nodes — no registry pull, no auth
needed inside the cluster. Manifests set `imagePullPolicy: IfNotPresent` so pods use the loaded image instead of trying
to pull from the internet.

**Apply order enforces the dependency chain** (each `►` waits before the next):

```
namespace + secret
  ► postgres + redis        (rollout status — wait until readiness probes pass)
    ► prisma-migrate Job     (wait --for=condition=complete — schema built, then exit)
      ► backend + frontend   (rollout status — wait until ready)
        ► smoke test          (temp curl pod hits each Service: HTTP 200 = alive)
```

- A **Deployment** keeps a pod running and self-heals; a **Service** gives it a stable in-cluster DNS name (`postgres`,
  `redis`, `backend`, `frontend`) and load-balances to it. That stable name is why `DATABASE_URL` can say
  `@postgres:5432`.
- A **Job** runs once to completion and is *not* restarted forever — exactly right for migrations.
- A **readiness probe** tells Kubernetes when a pod is truly ready for traffic, which is what each `rollout status` /
  `wait` blocks on. This is what makes the ordering reliable instead of racy.
- The migrate Job must run **after** Postgres is ready (needs a live DB) and **before** the backend starts (backend
  assumes the tables exist).
- `envsubst` fills the `${BACKEND_IMAGE}` / `${FRONTEND_IMAGE}` / `${MIGRATE_IMAGE}` placeholders in the manifests with
  the real `:<sha>` tags at apply time.

When the job ends, the entire cluster is discarded. Nothing persists — which is exactly what makes each run reproducible
from a clean slate.

---

## 6. How to read a run

In the repo's **Actions** tab:

1. Click a workflow run to see its jobs. Green check = passed, red X = failed, yellow dot = in progress.
2. Click a job to expand its steps. Click a step to read its log output.
3. For CI, the four jobs appear side by side (parallel). For CD, `deploy` only starts after `build-and-push` succeeds.
4. If `deploy` fails, the **"Dump diagnostics on failure"** step (`if: failure()`) prints pod status, `describe pods` (
   events — why a pod is pending or crashing), and the last 100 lines of backend logs. Start there.
5. Published images appear under the repo's **Packages** section (`gw-backend`, `gw-frontend`). First push defaults to
   private visibility, which is fine for this project.

Common failure clues:

- `ImagePullBackOff` → image not loaded / wrong tag / pull policy. Check the `kind load` step.
- Migrate Job times out → Postgres not actually ready, or a bad `DATABASE_URL` in the Secret.
- Readiness probe never passes → the app crashed on boot; read its logs.

---

## 7. Local equivalent

`docker compose up --build` runs the same stack on your machine, using the **same images** and the **same Postgres 17 /
Redis 7**:

- `postgres` and `redis` start first and are healthchecked; the backend waits for them via
  `depends_on: condition: service_healthy`.
- `nginx` proxies `/api/` to the backend and everything else to the frontend, so the browser talks to one origin (no
  CORS problem).
- Named volumes (`pgdata`, `redisdata`) persist data across `down`/`up` — unlike the ephemeral cluster, which starts
  empty every time.

The mental model: docker-compose is your local dev mirror; the kind deploy in CD is the same containers proven to run
under a real orchestrator.

---

## 8. Beyond school scope

This pipeline is intentionally self-contained. In a production setting you would likely add:

- **A managed cluster** (EKS / GKE / AKS) instead of ephemeral kind, so deploys are long-lived.
- **Persistent volumes** for Postgres (the demo DB resets every run by design).
- **A real secret manager** (sealed-secrets, Vault, cloud secret stores) instead of plaintext demo values in
  `k8s/secret.yaml`.
- **Multiple environments** (staging → production) with the same `:<sha>` image promoted between them.
- **Rollout strategies** (canary, blue/green) and automated rollback on failed health checks.
- **An Ingress + TLS** instead of an in-cluster smoke test, to expose the app to real users.

The principles stay the same — gate quality in CI, build immutable artifacts, deploy in dependency order, verify before
declaring success.
