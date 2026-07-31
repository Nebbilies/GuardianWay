// Canonical audit action names. String column (not a Prisma enum) so the set
// grows without a migration; this union is the compile-time guard on call sites.
export const AUDIT_ACTIONS = [
    "auth.login",
    "auth.login_failed",
    "invite.issued",
    "password.setup",
    "school.created",
    "school.updated",
    "school.deleted",
    "school.restored",
    "admin.onboarded",
    "user.created",
    "user.updated",
    "user.deactivated",
    "user.restored",
    "bus.created",
    "bus.updated",
    "bus.deleted",
    "busRoute.created",
    "busRoute.updated",
    "busRoute.deleted",
    "busStop.created",
    "busStop.updated",
    "busStop.deleted",
    "student.created",
    "student.updated",
    "student.deleted",
    "student.card_assigned",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
