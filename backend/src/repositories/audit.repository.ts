import { AuditLog, Prisma } from "@prisma/client";
import { PaginatedResponse } from "@gw/shared";
import { db } from "../config/tenant-db";

export interface CreateAuditLogInput {
    action: string;
    actorId?: string | null;
    actorEmail?: string | null;
    actorRole?: string | null;
    schoolId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown> | null;
    traceId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
}

export interface GetAuditLogsParams {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    schoolId?: string;
    from?: string; // ISO date
    to?: string; // ISO date
}

class AuditRepository {
    async create(input: CreateAuditLogInput): Promise<void> {
        const data: Prisma.AuditLogUncheckedCreateInput = {
            action: input.action,
            actorId: input.actorId ?? null,
            actorEmail: input.actorEmail ?? null,
            actorRole: input.actorRole ?? null,
            schoolId: input.schoolId ?? null,
            targetType: input.targetType ?? null,
            targetId: input.targetId ?? null,
            traceId: input.traceId ?? null,
            ip: input.ip ?? null,
            userAgent: input.userAgent ?? null,
        };
        if (input.metadata != null) {
            data.metadata = input.metadata as Prisma.InputJsonValue;
        }
        // db() so an ADMIN's scoped client is used; create passes the tenant
        // extension through untouched and stores schoolId as supplied.
        await db().auditLog.create({ data });
    }

    // User is not a tenant-scoped model, so this lookup is unscoped by design —
    // it snapshots the actor's email regardless of the current tenant.
    async findActorEmail(actorId: string): Promise<string | null> {
        const user = await db().user.findFirst({
            where: { id: actorId },
            select: { email: true },
        });
        return user?.email ?? null;
    }

    async getAll(params: GetAuditLogsParams = {}): Promise<PaginatedResponse<AuditLog>> {
        const where: Prisma.AuditLogWhereInput = {};
        if (params.action) where.action = params.action;
        if (params.actorId) where.actorId = params.actorId;
        if (params.targetType) where.targetType = params.targetType;
        if (params.targetId) where.targetId = params.targetId;
        // For SUPER_ADMIN (unscoped base client) this filters by school; for an
        // ADMIN the tenant extension overrides schoolId to their own, so a passed
        // value can't be used to peek at another tenant.
        if (params.schoolId) where.schoolId = params.schoolId;
        if (params.from || params.to) {
            where.createdAt = {};
            if (params.from) where.createdAt.gte = new Date(params.from);
            if (params.to) where.createdAt.lte = new Date(params.to);
        }

        const [data, metadata] = await db()
            .auditLog.paginate({
                where,
                orderBy: { createdAt: "desc" },
            })
            .withPages({
                page: params.page || 1,
                limit: params.limit || 20,
                includePageCount: true,
            });

        return { data, metadata };
    }
}

export const auditRepository = new AuditRepository();
