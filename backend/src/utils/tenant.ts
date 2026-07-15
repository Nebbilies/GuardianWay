import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {ValidationError} from "../errors/http-errors";

// RLS is the planned defense-in-depth layer; until then every school-owned query
// must be scoped through one of these.

// Writes: the acting user MUST belong to a school. SUPER_ADMIN (schoolId null) is
// platform-level and cannot create school-owned resources through these endpoints.
export function requireSchoolId(req: AuthenticatedRequest): string {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
        throw new ValidationError("Tài khoản không gắn với trường học nào");
    }
    return schoolId;
}

// Reads: scope to the user's school, or undefined for SUPER_ADMIN (sees all schools).
export function tenantScope(req: AuthenticatedRequest): string | undefined {
    return req.user?.schoolId ?? undefined;
}
