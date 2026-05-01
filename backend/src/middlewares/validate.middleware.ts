import {NextFunction, Request, Response} from "express";
import {ZodError, ZodSchema} from "zod";
import {ValidationError} from "../errors/http-errors";

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
                throw new ValidationError(error.issues.map((issue) => issue.message).join("; "));
            }
            throw error;
        }
    };
}
