import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, RequestHandler, Response } from "express";

// rate-limit.middleware.ts imports a live Redis client and the audit service
// (which pulls in Prisma) purely for module-level side effects unrelated to
// failClosed itself. Stub both so this spec stays container-free and fast.
vi.mock("../config/redis", () => ({
    // Building the real limiters at module load (loginByIp, loginByAccount, ...)
    // makes RedisStore run its script-load init step immediately. A resolved
    // string keeps that init step quiet instead of logging a spurious
    // "unexpected reply from redis client" on every test run.
    default: { sendCommand: vi.fn().mockResolvedValue("0".repeat(40)) },
    isRedisReady: vi.fn(() => true),
}));
vi.mock("../services/audit.service", () => ({
    auditService: { record: vi.fn().mockResolvedValue(undefined) },
}));

import {
    failClosed,
    refreshRateLimiter,
    requireRateLimitBackend,
    setupPasswordRateLimiter,
} from "./rate-limit.middleware";
import { isRedisReady } from "../config/redis";
import { ServiceUnavailableError, TooManyRequestsError } from "../errors/http-errors";

const fakeReq = {} as Request;
const fakeRes = {} as Response;

describe("failClosed", () => {
    it("converts a raw store error into a ServiceUnavailableError (503)", () => {
        const stub: RequestHandler = (_req, _res, next) => next(new Error("redis exploded"));
        const next = vi.fn();

        failClosed(stub)(fakeReq, fakeRes, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(ServiceUnavailableError);
        expect(err.status).toBe(503);
        expect(err.detail).toBe("Không thể xác thực lúc này, vui lòng thử lại sau");
    });

    it("passes a TooManyRequestsError through unchanged, not relabelled as 503", () => {
        const original = new TooManyRequestsError();
        const stub: RequestHandler = (_req, _res, next) => next(original);
        const next = vi.fn();

        failClosed(stub)(fakeReq, fakeRes, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err).toBe(original);
        expect(err).not.toBeInstanceOf(ServiceUnavailableError);
        expect(err.status).toBe(429);
    });

    it("calls next with no argument when the wrapped limiter succeeds", () => {
        const stub: RequestHandler = (_req, _res, next) => next();
        const next = vi.fn();

        failClosed(stub)(fakeReq, fakeRes, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });
});

// requireRateLimitBackend is the fail-closed guard: auth requests get a 503
// rather than silently skipping the counter when Redis isn't ready to enforce
// it. Stubbed isRedisReady() keeps this container-free.
describe("requireRateLimitBackend", () => {
    afterEach(() => {
        vi.mocked(isRedisReady).mockReturnValue(true);
    });

    it("passes through when Redis is ready", () => {
        vi.mocked(isRedisReady).mockReturnValue(true);
        const next = vi.fn();

        requireRateLimitBackend(fakeReq, fakeRes, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it("produces a ServiceUnavailableError (503) when Redis is not ready", () => {
        vi.mocked(isRedisReady).mockReturnValue(false);
        const next = vi.fn();

        requireRateLimitBackend(fakeReq, fakeRes, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err).toBeInstanceOf(ServiceUnavailableError);
        expect(err.status).toBe(503);
    });
});

// The refresh and setup-password limiters had zero coverage — assert each is
// shaped like loginRateLimiters: an array that fails closed first.
describe("refreshRateLimiter and setupPasswordRateLimiter", () => {
    it("refreshRateLimiter is an array whose first element is requireRateLimitBackend", () => {
        expect(Array.isArray(refreshRateLimiter)).toBe(true);
        expect(refreshRateLimiter[0]).toBe(requireRateLimitBackend);
    });

    it("setupPasswordRateLimiter is an array whose first element is requireRateLimitBackend", () => {
        expect(Array.isArray(setupPasswordRateLimiter)).toBe(true);
        expect(setupPasswordRateLimiter[0]).toBe(requireRateLimitBackend);
    });
});
