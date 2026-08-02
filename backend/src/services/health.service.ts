import { logger } from "../utils/logger";

export type CheckResult = "ok" | "fail";

export interface ReadinessReport {
    status: "ok" | "fail";
    checks: {
        db: CheckResult;
        redis: CheckResult;
    };
}

export interface ReadinessDeps {
    pingDb: () => Promise<unknown>;
    pingRedis: () => Promise<unknown>;
    timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 1000;

// A dependency that hangs must fail the probe, not hang it — an unanswered probe
// leaves the orchestrator with no signal at all.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
        promise.then(
            (value) => { clearTimeout(timer); resolve(value); },
            (error) => { clearTimeout(timer); reject(error); },
        );
    });
}

// The routes are mounted above pinoHttp on purpose so probe traffic (every few
// seconds) doesn't flood the request log — but that also means nothing else
// ever records a failing dependency. Log here instead, and only on failure, so
// a healthy replica stays as silent as the routing already intends.
async function run(name: "db" | "redis", check: () => Promise<unknown>, ms: number): Promise<CheckResult> {
    try {
        await withTimeout(check(), ms);
        return "ok";
    } catch (error) {
        logger.error("readiness check failed", {
            check: name,
            error: error instanceof Error ? error.message : String(error),
        });
        return "fail";
    }
}

export async function checkReadiness(deps: ReadinessDeps): Promise<ReadinessReport> {
    const ms = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const [db, redis] = await Promise.all([
        run("db", deps.pingDb, ms),
        run("redis", deps.pingRedis, ms),
    ]);

    return {
        status: db === "ok" && redis === "ok" ? "ok" : "fail",
        checks: { db, redis },
    };
}
