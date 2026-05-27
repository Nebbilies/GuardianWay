import {NextFunction, Request, Response} from "express";
import {ZodError, ZodSchema} from "zod";
import {ValidationError} from "../errors/http-errors";
import {FieldError} from "../errors/app-error";

interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }

            if (schemas.query) {
                req.query = schemas.query.parse(req.query) as Request["query"];
            }

            if (schemas.params) {
                req.params = schemas.params.parse(req.params) as Request["params"];
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const fieldErrors: FieldError[] = error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                    code: issue.code,
                }));
                const detail = fieldErrors.map((e) => `${e.field}: ${e.message}`).join("; ");
                throw new ValidationError(detail || "Validation failed", fieldErrors);
            }
            throw error;
        }
    };
}
