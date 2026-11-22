import { Prisma } from "@prisma/client";
import type { Database } from "../../../config/database";
import prisma from "../../../config/prisma";
import { listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
import type { Principal } from "../../../http/principal";

export const auditRepository = {
    createAutonomous(data: Prisma.AuditLogUncheckedCreateInput) { return prisma.auditLog.create({ data }); },
    create(database: Database, data: Prisma.AuditLogUncheckedCreateInput) {
        return database.auditLog.create({ data });
    },
    async list(actor: Principal, query: ListQuery & {
        action?: string; actorId?: string; targetType?: string; targetId?: string;
        schoolId?: string; from?: string; to?: string;
    }) {
        const where: Prisma.AuditLogWhereInput = {
            schoolId: actor.kind === "school" ? actor.schoolId : query.schoolId,
            ...(actor.kind === "platform" ? { changeSummary: { path: ["scope"], equals: "PLATFORM" } } : {}),
            action: query.action, actorId: query.actorId,
            subjectKind: query.targetType, subjectReference: query.targetId,
            createdAt: { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined },
        };
        const [data, count] = await Promise.all([
            prisma.auditLog.findMany({ where, ...listOptions(query, ["createdAt", "occurredAt"], "-createdAt") }),
            prisma.auditLog.count({ where }),
        ]);
        return pageResult(data, count, query);
    },
};
