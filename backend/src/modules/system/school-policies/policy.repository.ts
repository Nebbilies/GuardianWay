import type { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
export const policyRepository = {
    list(schoolId: string) { return prisma.schoolPolicyVersion.findMany({ where: { schoolId }, orderBy: { versionNo: "desc" } }); },
    find(schoolId: string, id: string, database: Database = prisma) { return database.schoolPolicyVersion.findFirst({ where: { schoolId, id } }); },
    latest(database: Database, schoolId: string) { return database.schoolPolicyVersion.findFirst({ where: { schoolId }, orderBy: { versionNo: "desc" } }); },
    create(database: Database, data: Prisma.SchoolPolicyVersionUncheckedCreateInput) { return database.schoolPolicyVersion.create({ data }); },
    close(database: Database, schoolId: string, id: string, effectiveTo: Date) { return database.schoolPolicyVersion.updateMany({ where: { schoolId, id }, data: { effectiveTo } }); },
};
