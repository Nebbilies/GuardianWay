import {NextFunction, Request, Response} from "express";
import {randomUUID} from "crypto";

// Assigns a stable traceId per request (honoring an inbound x-request-id) and
// echoes it back on the response. Request-completion logging is handled by
// pino-http (see app.ts), which reuses this traceId via genReqId.
export function requestContext(req: Request, res: Response, next: NextFunction) {
    const incomingTraceId = req.header("x-request-id");
    const traceId = incomingTraceId && incomingTraceId.trim() ? incomingTraceId : randomUUID();

    req.traceId = traceId;
    res.setHeader("x-request-id", traceId);

    next();
}
