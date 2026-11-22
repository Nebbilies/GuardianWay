import type { Prisma } from "@prisma/client";
import prisma from "../../../../config/prisma";
import type { Database } from "../../../../config/database";
export const guardianRepository = {
    async list(
        schoolId: string,
        studentId: string,
        database: Database = prisma,
    ) {
        const rows = await database.guardianLink.findMany({
            where: { schoolId, studentId },
            orderBy: { effectiveFrom: "desc" },
            include: {
                guardianAccountIdRef: {
                    select: { id: true, displayName: true, email: true },
                },
            },
        });
        return rows.map(({ guardianAccountIdRef: guardian, ...row }) => ({
            ...row,
            guardian,
        }));
    },
    create(database: Database, data: Prisma.GuardianLinkUncheckedCreateInput) {
        return database.guardianLink.create({ data });
    },
    find(database: Database, schoolId: string, studentId: string, id: string) {
        return database.guardianLink.findFirst({
            where: { schoolId, studentId, id, effectiveTo: null },
        });
    },
    close(
        database: Database,
        schoolId: string,
        studentId: string,
        at: Date,
        reason: string,
        id?: string,
    ) {
        return database.guardianLink.updateMany({
            where: { schoolId, studentId, id, effectiveTo: null },
            data: { effectiveTo: at, reason },
        });
    },
};
