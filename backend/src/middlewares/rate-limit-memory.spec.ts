import { expect, it, vi } from "vitest";
import express, {
    type ErrorRequestHandler,
    type RequestHandler,
} from "express";
import request from "supertest";

vi.mock("../config/redis", () => ({
    redisEnabled: false,
    default: { sendCommand: vi.fn(), set: vi.fn() },
    isRedisReady: () => false,
}));
vi.mock("../modules/system/audit", () => ({
    recordAuthAudit: vi.fn().mockResolvedValue(undefined),
}));

import redisClient from "../config/redis";
import { recordAuthAudit } from "../modules/system/audit";
import { loginRateLimiters } from "./rate-limit.middleware";

it("keeps login rate limiting and audit deduplication working without Redis", async () => {
    const app = express();
    app.use(express.json());
    const rejectLogin: RequestHandler = (_req, res) => {
        res.sendStatus(401);
    };
    app.post("/login", loginRateLimiters, rejectLogin);
    const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
        res.status(error.status || 500).json({ code: error.code });
    };
    app.use(handleError);
    for (let attempt = 0; attempt < 5; attempt++) {
        expect(
            (
                await request(app)
                    .post("/login")
                    .send({ email: "memory@example.test" })
            ).status,
        ).toBe(401);
    }
    for (let attempt = 0; attempt < 2; attempt++) {
        const blocked = await request(app)
            .post("/login")
            .send({ email: "memory@example.test" });
        expect(blocked.status).toBe(429);
        expect(blocked.headers["retry-after"]).toBeDefined();
    }
    expect(recordAuthAudit).toHaveBeenCalledTimes(1);
    expect(redisClient.sendCommand).not.toHaveBeenCalled();
    expect(redisClient.set).not.toHaveBeenCalled();
});
