import type { Request } from "express";
export function requestMetadata(req: Request) {
    return {
        traceId: req.traceId,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    };
}
