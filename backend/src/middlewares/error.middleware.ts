import {NextFunction, Request, Response} from "express";
import {AppError, FieldError} from "../errors/app-error";
import {InternalError, NotFoundError} from "../errors/http-errors";
import {logger} from "../utils/logger";

interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    code: string;
    detail: string;
    message: string;
    instance: string;
    traceId: string;
    timestamp: string;
    errors?: FieldError[];
}

// keep every error response the same format based of rfc7807
function toProblemDetails(req: Request, error: AppError): ProblemDetails {
    const detail = error.detail || error.title;

    const body: ProblemDetails = {
        type: `https://api.guardianway.local/problems/${error.code.toLowerCase()}`,
        title: error.title,
        status: error.status,
        code: error.code,
        detail,
        message: detail,
        instance: req.originalUrl,
        traceId: req.traceId,
        timestamp: new Date().toISOString(),
    };

    if (error.errors && error.errors.length > 0) {
        body.errors = error.errors;
    }

    return body;
}

// return AppError else generic InternalError to avoid leaking internal details
function normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    return new InternalError();
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

// Global error handler
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
    const normalized = normalizeError(error);

    logger.error("request.failed", {
        traceId: req.traceId,
        method: req.method,
        path: req.originalUrl,
        statusCode: normalized.status,
        code: normalized.code,
        message: normalized.message,
        isOperational: normalized.isOperational,
        stack: error instanceof Error ? error.stack : undefined,
    });

    const body = toProblemDetails(req, normalized);
    res.status(normalized.status).json(body);
}
