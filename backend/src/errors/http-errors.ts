import {AppError, FieldError} from "./app-error";

export class ValidationError extends AppError {
    constructor(detail = "Validation failed", errors?: FieldError[]) {
        super({
            code: "VALIDATION_ERROR",
            status: 400,
            title: "Validation failed",
            detail,
            errors,
        });
    }
}

export class AuthenticationError extends AppError {
    constructor(detail = "Authentication required") {
        super({
            code: "AUTHENTICATION_ERROR",
            status: 401,
            title: "Authentication failed",
            detail,
        });
    }
}

export class AuthorizationError extends AppError {
    constructor(detail = "You do not have permission") {
        super({
            code: "AUTHORIZATION_ERROR",
            status: 403,
            title: "Forbidden",
            detail,
        });
    }
}

export class NotFoundError extends AppError {
    constructor(detail = "Resource not found") {
        super({
            code: "NOT_FOUND",
            status: 404,
            title: "Not found",
            detail,
        });
    }
}

export class ConflictError extends AppError {
    constructor(detail = "Resource conflict") {
        super({
            code: "CONFLICT",
            status: 409,
            title: "Conflict",
            detail,
        });
    }
}

export class DomainRuleError extends AppError {
    constructor(detail = "Domain rule violated") {
        super({
            code: "DOMAIN_RULE_ERROR",
            status: 422,
            title: "Domain rule violation",
            detail,
        });
    }
}

export class InternalError extends AppError {
    constructor(detail = "Internal server error") {
        super({
            code: "INTERNAL_ERROR",
            status: 500,
            title: "Internal server error",
            detail,
            isOperational: false,
        });
    }
}

export class TooManyRequestsError extends AppError {
    constructor(detail = "Quá nhiều yêu cầu, vui lòng thử lại sau") {
        super({
            code: "TOO_MANY_REQUESTS",
            status: 429,
            title: "Too many requests",
            detail,
        });
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(detail = "Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau") {
        super({
            code: "SERVICE_UNAVAILABLE",
            status: 503,
            title: "Service unavailable",
            detail,
        });
    }
}
