import { NextFunction, Response } from "express";
import type { CanonicalRole } from "../http/principal";
import { AuthenticatedRequest } from "./auth.middleware";
import { AuthenticationError, AuthorizationError } from "../errors/http-errors";

export function authorize(allowedRoles: readonly CanonicalRole[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AuthenticationError());
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AuthorizationError());
        }

        return next();
    };
}
