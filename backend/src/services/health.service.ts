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

async function run(check: () => Promise<unknown>, ms: number): Promise<CheckResult> {
    try {
        await withTimeout(check(), ms);
        return "ok";
    } catch {
        return "fail";
    }
}

export async function checkReadiness(deps: ReadinessDeps): Promise<ReadinessReport> {
    const ms = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const [db, redis] = await Promise.all([
        run(deps.pingDb, ms),
        run(deps.pingRedis, ms),
    ]);

    return {
        status: db === "ok" && redis === "ok" ? "ok" : "fail",
        checks: { db, redis },
    };
}
