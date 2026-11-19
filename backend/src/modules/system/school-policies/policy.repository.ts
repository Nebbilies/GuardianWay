import type { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
export const policyRepository = {
    list(schoolId: string) { return prisma.schoolPolicyVersion.findMany({ where: { schoolId }, orderBy: { versionNo: "desc" } }); },
    find(schoolId: string, id: string, database: Database = prisma) { return database.schoolPolicyVersion.findFirst({ where: { schoolId, id } }); },
    async lock(database: Database, schoolId: string, id: string, exclusive: boolean) {
        if (exclusive) await database.$queryRaw`SELECT id FROM school_policy_version WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR UPDATE`;
        else await database.$queryRaw`SELECT id FROM school_policy_version WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR SHARE`;
    },
    affectedTrips(database: Database, schoolId: string, operatingPolicyId: string, from: Date) {
        return database.trip.count({ where: { schoolId, operatingPolicyId, status: "PLANNED", plannedStartAt: { gte: from } } });
    },
    latest(database: Database, schoolId: string) { return database.schoolPolicyVersion.findFirst({ where: { schoolId }, orderBy: { versionNo: "desc" } }); },
    create(database: Database, data: Prisma.SchoolPolicyVersionUncheckedCreateInput) { return database.schoolPolicyVersion.create({ data }); },
    close(database: Database, schoolId: string, id: string, effectiveTo: Date) { return database.schoolPolicyVersion.updateMany({ where: { schoolId, id }, data: { effectiveTo } }); },
};
