import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { runWithTenant } from "../config/tenant-db";

// Opens a tenant context for the rest of the request, seeded from the authenticated
// user. Must run AFTER `authenticate` (needs req.user) and BEFORE any route that
// touches the DB, so `db()` deep in the repositories resolves the right client.
export function tenantContext(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    runWithTenant(
        {
            schoolId: req.user?.schoolId ?? null,
            userId: req.user?.userId,
            role: req.user?.role,
            traceId: req.traceId,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        },
        () => next(),
    );
}
