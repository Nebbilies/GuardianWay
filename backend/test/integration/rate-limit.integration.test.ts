import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import prisma from "../../src/config/prisma";
import redisClient from "../../src/config/redis";
import { resetAndSeed, TEST_PASSWORD, type Fixture } from "./fixtures";
import { loadApp } from "./helpers/login";

describe("login rate limiting", () => {
    let app: Express;
    let fx: Fixture;

    beforeAll(async () => {
        app = await loadApp();
    });

    beforeEach(async () => {
        fx = await resetAndSeed();
        // Counters live in Redis and outlive a test; clear them between cases.
        await redisClient.flushDb();
    });

    it("blocks the sixth consecutive failed login for one account", async () => {
        const attempt = () =>
            request(app)
                .post("/api/auth/login")
                .send({ email: fx.adminA.email, password: "wrong-password" });

        for (let i = 0; i < 5; i += 1) {
            const res = await attempt();
            expect(res.status).toBe(401);
        }

        const blocked = await attempt();
        expect(blocked.status).toBe(429);
        expect(blocked.headers["retry-after"]).toBeDefined();
        expect(blocked.body.code).toBe("TOO_MANY_REQUESTS");
    });

    it("records an auth.rate_limited audit row when it blocks", async () => {
        for (let i = 0; i < 6; i += 1) {
            await request(app)
                .post("/api/auth/login")
                .send({ email: fx.adminA.email, password: "wrong-password" });
        }

        const row = await prisma.auditLog.findFirst({
            where: { action: "auth.rate_limited" },
            orderBy: { createdAt: "desc" },
        });

        expect(row).not.toBeNull();
        expect(row?.actorEmail).toBe(fx.adminA.email);
        expect((row?.metadata as { reason?: string } | null)?.reason).toBe("account");
    });

    it("does not count successful logins against the account budget", async () => {
        for (let i = 0; i < 8; i += 1) {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: fx.adminA.email, password: TEST_PASSWORD });
            expect(res.status).toBe(200);
        }
    });

    it("keeps a separate budget for a different account", async () => {
        for (let i = 0; i < 6; i += 1) {
            await request(app)
                .post("/api/auth/login")
                .send({ email: fx.adminA.email, password: "wrong-password" });
        }

        // adminB has its own account budget; the shared per-IP budget is 20, so
        // six attempts against A must not lock B out.
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: fx.adminB.email, password: TEST_PASSWORD });

        expect(res.status).toBe(200);
    });

    it("does not store the plaintext email in any Redis key", async () => {
        await request(app)
            .post("/api/auth/login")
            .send({ email: fx.adminA.email, password: "wrong-password" });

        const keys = await redisClient.keys("*");
        expect(keys.length).toBeGreaterThan(0);
        for (const key of keys) {
            expect(key).not.toContain(fx.adminA.email);
        }
    });
});
