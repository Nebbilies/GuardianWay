# CI/CD Glossary

One-line definitions for the terms used across this pipeline. See [README.md](./README.md) for how they fit together.

## GitHub Actions

- **Workflow** — a YAML file in `.github/workflows/` describing automation that runs on an event (e.g. `ci.yml`,
  `cd.yml`).
- **Job** — a unit of a workflow that runs on its own fresh runner VM; jobs run in parallel unless linked by `needs:`.
- **Step** — a single ordered action inside a job: either a shell command (`run:`) or a reusable action (`uses:`).
- **Runner** — the virtual machine that executes a job (here `ubuntu-latest`); starts empty, so each job must check out
  the code itself.
- **Trigger** — the event that starts a workflow (`on: pull_request`, `on: push`).
- **Action** — a packaged, reusable step referenced by `uses:` (e.g. `actions/checkout@v4`,
  `docker/build-push-action@v6`).
- **`needs:`** — declares that a job must wait for another job to succeed first (and can read its `outputs`).
- **Cache** — stored data reused across runs to save time (npm cache for installs; `type=gha` Buildx cache for image
  layers).
- **Secret** (Actions) — an encrypted value exposed to a workflow; `GITHUB_TOKEN` is auto-minted each run.
- **`GITHUB_TOKEN`** — a per-run credential; needs `packages: write` to push images to GHCR.
- **Artifact** — the durable output a pipeline produces; here, the container images pushed to GHCR.

## Containers and images

- **Image** — an immutable, layered bundle of code + runtime, built from a Dockerfile.
- **Container** — a running instance of an image.
- **Tag** — a human-readable label on an image (`:latest`, `:<sha>`); `:<sha>` is immutable, `:latest` moves.
- **Digest** — a content hash (`sha256:…`) that identifies an exact image build, regardless of tag.
- **Registry** — a server that stores and serves images by name + tag.
- **GHCR** — GitHub Container Registry (`ghcr.io`), the registry this project pushes to.
- **Multi-stage build** — a Dockerfile with several `FROM ... AS <stage>` sections; `--target <stage>` stops at one (
  e.g. `runtime` vs `build`).
- **Build context** — the directory sent to the build (here `.`, the repo root, so monorepo workspaces are visible).

## Kubernetes

- **Cluster** — a set of machines (nodes) running Kubernetes that schedules and runs containers.
- **kind** — "Kubernetes in Docker"; runs a throwaway cluster inside the runner for CD.
- **Node** — a machine in the cluster that hosts pods (in kind, a Docker container).
- **Pod** — the smallest deployable unit; one or more containers sharing a network/storage context.
- **Deployment** — keeps N identical pods running, self-heals, and rolls out updates.
- **ReplicaSet** — the object a Deployment uses under the hood to maintain the desired pod count.
- **Service** — a stable in-cluster DNS name + load balancer in front of a set of pods (selected by label).
- **Job** (k8s) — runs pods to completion once (not restarted forever) — used for the migration.
- **Namespace** — a named scope that isolates resources (everything here lives in `guardianway`).
- **Secret** (k8s) — holds sensitive key/value data; injected into pods via `envFrom`.
- **ConfigMap** — like a Secret but for non-sensitive configuration values.
- **Label** — a key/value tag on objects (`app: backend`); how selectors find pods.
- **Selector** — a label filter; a Deployment uses it to own its pods, a Service to route to them.
- **Readiness probe** — a check that tells Kubernetes when a pod is ready to receive traffic.
- **Liveness probe** — a check that restarts a pod if it becomes unhealthy (not used here, but the sibling of
  readiness).
- **Rollout** — the process of applying a Deployment's pods; `kubectl rollout status` waits until it's complete.
- **Manifest** — a YAML file declaring a Kubernetes resource (the files under `k8s/`).
- **`kubectl`** — the CLI used to apply manifests and query the cluster.
- **`kubectl apply -f`** — create or update resources from a manifest (idempotent; `-f -` reads from stdin).
- **`imagePullPolicy: IfNotPresent`** — use the image already on the node instead of pulling from a registry (needed for
  `kind load`-ed images).
- **`kind load docker-image`** — inject a locally-built image into the kind cluster's nodes.
- **`envsubst`** — substitutes `${VAR}` placeholders in a manifest with real environment values before `kubectl apply`.

## Project-specific

- **`gw-backend`** — the backend API image (Express + Prisma), runtime stage.
- **`gw-frontend`** — the Next.js web app image.
- **`gw-migrate`** — the backend *build*-stage image (has the Prisma CLI); runs migrations, never pushed to GHCR.
- **`gw-secrets`** — the Kubernetes Secret holding DB/Redis URLs and JWT secrets for the deployed pods.
- **`prisma migrate deploy`** — applies pending migration files to the database schema (idempotent; no-op when nothing
  is pending).
