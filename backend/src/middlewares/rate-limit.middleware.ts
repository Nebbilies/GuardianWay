import crypto from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit, { ipKeyGenerator, Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient, { isRedisReady } from "../config/redis";
import { AppError } from "../errors/app-error";
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

// Gates the audit write to at most once per limiter key per window. The first
// block for a key claims the flag (SET NX) and writes the row; every later
// block on the same key inside the same window sees the flag already set and
// skips — otherwise a sustained flood turns into one unthrottled INSERT per
// rejected request. Redis already holds the limiter's own per-window state, so
// the flag lives there too rather than in a separate mechanism.
// A Redis failure here fails OPEN to writing the row: the flag is only a dedup
// on top of the block, never a gate on it, so "can't tell if we already wrote
// it" must default to writing rather than silently dropping the audit trail.
async function claimAuditWrite(flagKey: string): Promise<boolean> {
    try {
        const result = await redisClient.set(flagKey, "1", {
            condition: "NX",
            expiration: { type: "PX", value: WINDOW_MS },
        });
        return result !== null;
    } catch {
        return true;
    }
}

// The limiter runs before the controller, so there is no ALS to read the actor
// from — actor fields are passed explicitly, matching the /api/auth convention.
function onBlocked(reason: "ip" | "account", auditFlagPrefix: string) {
    return (req: Request, res: Response, next: NextFunction, optionsUsed: Options) => {
        // Neither standardHeaders nor legacyHeaders is enabled below (an
        // unauthenticated caller must not learn the remaining budget), so
        // Retry-After has to be set by hand — it is the one signal a legitimate
        // client still needs out of a 429.
        res.setHeader("Retry-After", String(Math.ceil(WINDOW_MS / 1000)));

        const email = typeof req.body?.email === "string" ? req.body.email : null;

        // Fire-and-forget by design: auditService.record already swallows its own
        // errors, and awaiting a DB write here would put it on the response path
        // of the very request being rejected. next() below runs immediately.
        void (async () => {
            const key = await optionsUsed.keyGenerator(req, res);
            // "audit:" prefix keeps this flag out of the RedisStore's own key
            // namespace — the store already owns a key at exactly
            // `${auditFlagPrefix}${key}` for its hit counter, and reusing that
            // namespace here would make SET NX see the counter itself as the
            // flag and never write.
            const shouldWrite = await claimAuditWrite(`audit:${auditFlagPrefix}${key}`);
            if (!shouldWrite) return;

            await auditService.record(
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
        })();

        next(new TooManyRequestsError("Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút"));
    };
}

// requireRateLimitBackend only catches Redis being unready BEFORE the limiter
// runs. If Redis drops mid-request, after that check but before the store's
// increment() resolves, express-rate-limit (with passOnStoreError left at its
// default false) rethrows the raw store error through next(err). That error
// is not an AppError, so error.middleware.ts would normalise it to a generic
// 500 with English text instead of the same 503 the readiness guard produces.
// The security property (fail closed) already holds either way; this wrapper
// only fixes the response contract by converting anything that reaches next()
// and isn't already one of our AppError subclasses (the limit-exceeded path
// below calls next() with a TooManyRequestsError, which must pass through
// untouched).
export function failClosed(limiter: RequestHandler): RequestHandler {
    return (req, res, next) => {
        limiter(req, res, (err?: unknown) => {
            if (!err) {
                next();
                return;
            }
            if (!(err instanceof AppError)) {
                next(new ServiceUnavailableError("Không thể xác thực lúc này, vui lòng thử lại sau"));
                return;
            }
            // Already one of ours (e.g. TooManyRequestsError from onBlocked below) —
            // pass it through untouched rather than relabelling it as a store failure.
            next(err);
        });
    };
}

function build(opts: Pick<Options, "limit" | "keyGenerator"> & Partial<Pick<Options, "skipSuccessfulRequests">> & {
    prefix: string;
    reason: "ip" | "account";
}): RequestHandler {
    return failClosed(rateLimit({
        windowMs: WINDOW_MS,
        // `limit` is the canonical option in v8; `max` is a deprecated alias.
        limit: opts.limit,
        keyGenerator: opts.keyGenerator,
        skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
        // Publishing RateLimit-* here would hand an unauthenticated caller the
        // exact remaining budget for any account they named, and the per-IP and
        // per-account limiters share one header namespace, so whichever runs
        // last would silently overwrite the other's headers. The 429 body plus
        // an explicit Retry-After (set in onBlocked) is the only signal a
        // legitimate client needs.
        standardHeaders: false,
        legacyHeaders: false,
        store: store(opts.prefix),
        handler: onBlocked(opts.reason, opts.prefix),
    }));
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
