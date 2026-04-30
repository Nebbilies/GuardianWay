import {NextFunction, Request, Response} from "express";
import {randomUUID} from "crypto";
import {logger} from "../utils/logger";

export function requestContext(req: Request, res: Response, next: NextFunction) {
    const incomingTraceId = req.header("x-request-id");
    const traceId = incomingTraceId && incomingTraceId.trim() ? incomingTraceId : randomUUID();

    req.traceId = traceId;
    req.requestStartTimeMs = Date.now();
    res.setHeader("x-request-id", traceId);

    res.on("finish", () => {
        const durationMs = Date.now() - req.requestStartTimeMs;
        logger.info("request.completed", {
            traceId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
        });
    });

    next();
}
