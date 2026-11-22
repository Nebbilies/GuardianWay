import { NextFunction, Request, Response } from "express";
import { authService, ACCESS_COOKIE_NAME } from "../modules/system/auth";
import { AuthenticatedRequestUser } from "../types/auth";
import { AuthenticationError } from "../errors/http-errors";
import type { Principal } from "../http/principal";

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedRequestUser;
}

export function authenticatedActor(req: Request): Principal {
    if (!req.user) {
        throw new AuthenticationError("Authentication required");
    }
    return req.user;
}

export function authenticate(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
) {
    try {
        const bearerToken = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : undefined;

        const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
        const token = bearerToken || cookieToken;

        if (!token) {
            throw new AuthenticationError("Authentication required");
        }

        req.user = authService.verifyAccessToken(token);

        return next();
    } catch (error) {
        return next(error);
    }
}
