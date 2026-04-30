import {AppError} from "./app-error";

export class ValidationError extends AppError {
    constructor(detail = "Validation failed") {
        super({
            code: "VALIDATION_ERROR",
            status: 400,
            title: "Validation failed",
            detail,
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
