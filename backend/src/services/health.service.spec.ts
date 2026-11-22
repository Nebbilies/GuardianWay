import { describe, expect, it, vi } from "vitest";
import { checkReadiness } from "./health.service";

const ok = () => Promise.resolve(1);
const boom = () => Promise.reject(new Error("down"));
const hang = () => new Promise(() => {});

describe("checkReadiness", () => {
    it("skips Redis when explicitly disabled while still checking PostgreSQL", async () => {
        const pingRedis = vi.fn(boom);
        expect(
            await checkReadiness({
                pingDb: ok,
                pingRedis,
                redisEnabled: false,
            }),
        ).toEqual({ status: "ok", checks: { db: "ok", redis: "disabled" } });
        expect(
            await checkReadiness({
                pingDb: boom,
                pingRedis,
                redisEnabled: false,
            }),
        ).toEqual({
            status: "fail",
            checks: { db: "fail", redis: "disabled" },
        });
        expect(pingRedis).not.toHaveBeenCalled();
    });
    it("reports ok when both dependencies answer", async () => {
        const report = await checkReadiness({ pingDb: ok, pingRedis: ok });
        expect(report).toEqual({
            status: "ok",
            checks: { db: "ok", redis: "ok" },
        });
    });

    it("reports which dependency failed", async () => {
        const report = await checkReadiness({ pingDb: boom, pingRedis: ok });
        expect(report).toEqual({
            status: "fail",
            checks: { db: "fail", redis: "ok" },
        });
    });

    it("reports fail when both are down", async () => {
        const report = await checkReadiness({ pingDb: boom, pingRedis: boom });
        expect(report).toEqual({
            status: "fail",
            checks: { db: "fail", redis: "fail" },
        });
    });

    it("treats a hanging dependency as failed rather than hanging itself", async () => {
        const report = await checkReadiness({
            pingDb: hang,
            pingRedis: ok,
            timeoutMs: 50,
        });
        expect(report.checks.db).toBe("fail");
        expect(report.status).toBe("fail");
    });
});
