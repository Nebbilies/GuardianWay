import type { Prisma } from "@prisma/client";
import prisma from "../../../../config/prisma";
import type { Database } from "../../../../config/database";
export const cardRepository = {
    list(schoolId: string, studentId: string, database: Database = prisma) {
        return database.studentCardAssignment.findMany({
            where: { schoolId, studentId },
            orderBy: { effectiveFrom: "desc" },
        });
    },
    create(
        database: Database,
        data: Prisma.StudentCardAssignmentUncheckedCreateInput,
    ) {
        return database.studentCardAssignment.create({ data });
    },
    find(database: Database, schoolId: string, studentId: string, id: string) {
        return database.studentCardAssignment.findFirst({
            where: { schoolId, studentId, id, effectiveTo: null },
        });
    },
    assigned(
        database: Database,
        schoolId: string,
        technology: string,
        cardUid: string,
    ) {
        return database.studentCardAssignment.findFirst({
            where: { schoolId, technology, cardUid, effectiveTo: null },
        });
    },
    close(
        database: Database,
        schoolId: string,
        studentId: string,
        id: string,
        at: Date,
        actorId: string,
        reason: string,
    ) {
        return database.studentCardAssignment.updateMany({
            where: { schoolId, studentId, id, effectiveTo: null },
            data: { effectiveTo: at, revokedById: actorId, reason },
        });
    },
};
