export interface FieldError {
    field: string;
    message: string;
    code?: string;
}

export interface AppErrorOptions {
    code: string;
    status: number;
    title: string;
    detail?: string;
    errors?: FieldError[];
    // if true: expected error. if false: unexpected error, should be monitored since maybe a bug.
    isOperational?: boolean;
}

export class AppError extends Error {
    readonly code: string;
    readonly status: number;
    readonly title: string;
    readonly detail?: string;
    readonly errors?: FieldError[];
    readonly isOperational: boolean;

    constructor(options: AppErrorOptions) {
        super(options.detail || options.title);
        this.name = "AppError";
        this.code = options.code;
        this.status = options.status;
        this.title = options.title;
        this.detail = options.detail;
        this.errors = options.errors;
        this.isOperational = options.isOperational ?? true;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
