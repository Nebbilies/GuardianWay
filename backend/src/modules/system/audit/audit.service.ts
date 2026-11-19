import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Database } from "../../../config/database";
import type { Principal } from "../../../http/principal";
import { logger } from "../../../utils/logger";
import { auditRepository } from "./audit.repository";

export type RequestMetadata = { traceId?: string; ipAddress?: string; userAgent?: string };
export type AuditEvent = {
    action: string; subjectKind: string; subjectReference: string; schoolId?: string | null;
    before?: unknown; after?: unknown; reason?: string;
};

function safeValue(value: unknown): Prisma.InputJsonValue | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) return value.map(safeValue);
    if (typeof value === "object") {
        const result: Record<string, Prisma.InputJsonValue | null> = {};
        for (const [key, item] of Object.entries(value)) {
            if (!/password|token|carduid/i.test(key)) result[key] = safeValue(item);
        }
        return result;
    }
    return null;
}

function auditData(actor: Principal | null, event: AuditEvent, metadata: RequestMetadata): Prisma.AuditLogUncheckedCreateInput {
    return {
        actorId: actor?.accountId ?? null, schoolId: event.schoolId ?? actor?.schoolId ?? null,
        action: event.action, subjectKind: event.subjectKind, subjectReference: event.subjectReference,
        occurredAt: new Date(), operationKey: randomUUID(), reason: event.reason,
        changeSummary: {
            schemaVersion: 1, scope: actor?.kind === "school" ? "SCHOOL" : "PLATFORM",
            actor: actor ? { id: actor.accountId, role: actor.role } : null,
            before: safeValue(event.before), after: safeValue(event.after), request: safeValue(metadata),
        },
    };
}
export async function recordAudit(database: Database, actor: Principal | null, event: AuditEvent, metadata: RequestMetadata = {}) {
    return auditRepository.create(database, auditData(actor, event, metadata));
}

export async function recordAuthAudit(actor: Principal | null, event: AuditEvent, metadata: RequestMetadata = {}) {
    try { await auditRepository.createAutonomous(auditData(actor, event, metadata)); }
    catch { logger.error("Authentication audit could not be recorded", { action: event.action }); }
}
import { requireSchoolAdmin, requirePlatform } from "../../../http/principal";
import type { AuditQuery } from "./audit.contracts";

export function listAuditEntries(actor: Principal, query: AuditQuery) {
    if (actor.kind === "platform") requirePlatform(actor); else requireSchoolAdmin(actor);
    return auditRepository.list(actor, query);
}
