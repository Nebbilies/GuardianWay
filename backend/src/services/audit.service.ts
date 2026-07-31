import { auditRepository, GetAuditLogsParams } from "../repositories/audit.repository";
import { currentContext } from "../config/tenant-db";
import { logger } from "../utils/logger";
import { AuditAction } from "../utils/audit.actions";

export interface AuditEventInput {
    action: AuditAction;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown> | null;
}

// Overrides for call sites that run BEFORE the tenant middleware (the /api/auth
// routes have no ALS): they pass actor/school/ip explicitly.
export interface AuditContextOverride {
    actorId?: string | null;
    actorEmail?: string | null;
    actorRole?: string | null;
    schoolId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    traceId?: string | null;
}

// `undefined` in the override means "not provided, fall back to ALS"; any other
// value (including null) wins — so an auth event can force schoolId=null.
function pick<T>(override: T | undefined, fallback: T): T {
    return override !== undefined ? override : fallback;
}

class AuditService {
    async record(event: AuditEventInput, ctx: AuditContextOverride = {}): Promise<void> {
        try {
            const als = currentContext();

            const actorId = pick(ctx.actorId, als?.userId ?? null);
            const actorRole = pick(ctx.actorRole, als?.role ?? null);
            const schoolId = pick(ctx.schoolId, als?.schoolId ?? null);
            const traceId = pick(ctx.traceId, als?.traceId ?? null);
            const ip = pick(ctx.ip, als?.ip ?? null);
            const userAgent = pick(ctx.userAgent, als?.userAgent ?? null);

            let actorEmail = pick(ctx.actorEmail, null);
            if (actorEmail == null && actorId) {
                actorEmail = await auditRepository.findActorEmail(actorId);
            }

            await auditRepository.create({
                action: event.action,
                actorId,
                actorEmail,
                actorRole,
                schoolId,
                targetType: event.targetType ?? null,
                targetId: event.targetId ?? null,
                metadata: event.metadata ?? null,
                traceId,
                ip,
                userAgent,
            });
        } catch (error) {
            // Best-effort: auditing must never break the user's action.
            logger.error("Ghi nhật ký kiểm toán thất bại", {
                action: event.action,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    async getAll(params: GetAuditLogsParams = {}) {
        return auditRepository.getAll(params);
    }
}

export const auditService = new AuditService();
