# GuardianWay — CD Deploy Flow

Source: `.github/workflows/cd.yml` (triggered on push to `main`). Two jobs: `build-and-push` publishes images to GHCR; `deploy` spins up a kind cluster and rolls out the app.

```mermaid
flowchart TD
    trig(["push → main"]) --> bp_checkout

    subgraph bp["Job: build-and-push"]
        direction TB
        bp_checkout["checkout"] --> bp_meta["compute owner_lc + 12-char sha_tag"]
        bp_meta --> bp_buildx["setup buildx"]
        bp_buildx --> bp_login["login to GHCR"]
        bp_login --> bp_be["build & push backend<br/>(runtime stage) → GHCR"]
        bp_login --> bp_fe["build & push frontend → GHCR"]
        bp_be --> bp_out{{"outputs: sha_tag, owner_lc"}}
        bp_fe --> bp_out
    end

    bp_out -->|needs: build-and-push| dp_checkout

    subgraph dp["Job: deploy"]
        direction TB
        dp_checkout["checkout"] --> dp_kind["create kind cluster<br/>(guardianway)"]
        dp_kind --> dp_build["build images locally for kind<br/>backend (runtime) · frontend · migrate (build stage)"]
        dp_build --> dp_load["kind load docker-image ×3"]

        dp_load --> dp_base["apply base resources<br/>namespace · secret · postgres · redis"]
        dp_base --> dp_baseready["rollout status<br/>postgres + redis"]

        dp_baseready --> dp_migrate["run migrations (Job)<br/>envsubst migrate-job.yaml<br/>wait condition=complete"]

        dp_migrate --> dp_app["deploy app<br/>envsubst backend.yaml + frontend.yaml"]
        dp_app --> dp_appready["rollout status<br/>backend + frontend"]

        dp_appready --> dp_smoke["smoke test (in-cluster)<br/>curl backend:8000 · frontend:3000"]
        dp_smoke --> dp_ok(["✅ deployed"])
    end

    %% failure branch
    dp_kind -. on failure .-> diag
    dp_load -. on failure .-> diag
    dp_baseready -. on failure .-> diag
    dp_migrate -. on failure .-> diag
    dp_appready -. on failure .-> diag
    dp_smoke -. on failure .-> diag
    diag["dump diagnostics<br/>get pods · describe · logs"]:::fail

    classDef fail fill:#ffe9e9,stroke:#d83a3a,color:#000
    classDef ok fill:#e9f9ec,stroke:#2faa55,color:#000
    class dp_ok ok
```

## Notes for the slide

- **Two images, three builds.** The runtime backend + frontend images are built once and pushed to GHCR in `build-and-push`. The `deploy` job rebuilds them locally (plus a third **migrate** image from the Dockerfile `build` stage) so kind can load them without pulling from GHCR.
- **Ordering is enforced by `rollout status` / `wait`.** Datastores must be `Ready` before migrations; migrations must `complete` before the app rolls out — otherwise the backend would start against an un-migrated schema.
- **`envsubst`** injects the image tag (`$SHA_TAG`, `$OWNER_LC`) into the k8s manifests at apply time.
- **Smoke test** hits `backend:8000` and `frontend:3000` from inside the cluster — fails the job if either is unreachable.
- **Failure branch** (`if: failure()`) dumps pods, `describe`, and logs for debugging — runs no matter which step broke.
