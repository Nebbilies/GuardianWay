import crypto from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit, { ipKeyGenerator, Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient, { isRedisReady } from "../config/redis";
import { ServiceUnavailableError, TooManyRequestsError } from "../errors/http-errors";
import { auditService } from "../services/audit.service";

const WINDOW_MS = 15 * 60 * 1000;
const IP_LOGIN_LIMIT = 20;
const ACCOUNT_LOGIN_LIMIT = 5;
const IP_REFRESH_LIMIT = 60;
const IP_SETUP_LIMIT = 10;

// A single IPv6 client owns a whole /64, so keying on the bare address lets one
// host rotate through addresses for free. ipKeyGenerator collapses IPv6 to its
// subnet and leaves IPv4 untouched; express-rate-limit's own validation rejects
// a custom keyGenerator that falls back to req.ip without it.
function ipKey(req: Request): string {
    return ipKeyGenerator(req.ip ?? "unknown");
}

// Counters live in Redis rather than in memory so they survive a restart and
// stay correct if the deployment ever runs more than one replica.
function store(prefix: string) {
    return new RedisStore({
        prefix,
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    });
}

function hashEmail(email: string): string {
    return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

// The limiter runs before the controller, so there is no ALS to read the actor
// from — actor fields are passed explicitly, matching the /api/auth convention.
function onBlocked(reason: "ip" | "account") {
    return (req: Request, _res: Response, next: NextFunction) => {
        const email = typeof req.body?.email === "string" ? req.body.email : null;

        void auditService.record(
            { action: "auth.rate_limited", metadata: { reason } },
            {
                actorId: null,
                actorEmail: email,
                schoolId: null,
                ip: req.ip ?? null,
                userAgent: req.headers["user-agent"] ?? null,
                traceId: req.traceId ?? null,
            },
        );

        next(new TooManyRequestsError("Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút"));
    };
}

function build(opts: Pick<Options, "limit" | "keyGenerator"> & Partial<Pick<Options, "skipSuccessfulRequests">> & {
    prefix: string;
    reason: "ip" | "account";
}): RequestHandler {
    return rateLimit({
        windowMs: WINDOW_MS,
        // `limit` is the canonical option in v8; `max` is a deprecated alias.
        limit: opts.limit,
        keyGenerator: opts.keyGenerator,
        skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
        standardHeaders: true,
        legacyHeaders: false,
        store: store(opts.prefix),
        handler: onBlocked(opts.reason),
    });
}

// Fails CLOSED on auth routes. If Redis is unavailable the limiter cannot count,
// and silently letting every attempt through would remove the control exactly
// when it cannot be observed. /readyz already reports the replica NotReady in
// this state, so it is out of rotation anyway.
export const requireRateLimitBackend: RequestHandler = (_req, _res, next) => {
    if (!isRedisReady()) {
        next(new ServiceUnavailableError("Không thể xác thực lúc này, vui lòng thử lại sau"));
        return;
    }
    next();
};

const loginByIp = build({
    prefix: "rl:ip:login:",
    reason: "ip",
    limit: IP_LOGIN_LIMIT,
    keyGenerator: ipKey,
});

// Keyed on a hash so Redis never holds a plaintext address.
const loginByAccount = build({
    prefix: "rl:acct:login:",
    reason: "account",
    limit: ACCOUNT_LOGIN_LIMIT,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        const email = typeof req.body?.email === "string" ? req.body.email : "";
        return email ? hashEmail(email) : ipKey(req);
    },
});

export const loginRateLimiters: RequestHandler[] = [
    requireRateLimitBackend,
    loginByIp,
    loginByAccount,
];

// Separate instances with their own prefixes. Sharing the login counter would let
// failed logins exhaust a legitimate user's refresh budget - a self-inflicted
// denial of service.
export const refreshRateLimiter: RequestHandler[] = [
    requireRateLimitBackend,
    build({
        prefix: "rl:ip:refresh:",
        reason: "ip",
        limit: IP_REFRESH_LIMIT,
        keyGenerator: ipKey,
    }),
];

export const setupPasswordRateLimiter: RequestHandler[] = [
    requireRateLimitBackend,
    build({
        prefix: "rl:ip:setup:",
        reason: "ip",
        limit: IP_SETUP_LIMIT,
        keyGenerator: ipKey,
    }),
];
