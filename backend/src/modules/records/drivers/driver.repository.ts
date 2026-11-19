import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { deletedFilter, listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
export const driverRepository = {
    find(schoolId: string, id: string, database: Database = prisma) { return database.driverProfile.findFirst({ where: { schoolId, id } }); },
    async list(schoolId: string, query: ListQuery & { status?: string; unlinked?: "true" | "false" }, exportAll = false) {
        const where: Prisma.DriverProfileWhereInput = { schoolId, deletedAt: deletedFilter(query), status: query.status, accountId: query.unlinked === "true" ? null : query.unlinked === "false" ? { not: null } : undefined, ...(query.search ? { OR: [{ fullName: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }] } : {}) };
        const [rows, count] = await Promise.all([
            prisma.driverProfile.findMany({ where, ...listOptions(query, ["code", "fullName", "createdAt", "status"], "-createdAt"), ...(exportAll ? { skip: undefined, take: undefined } : {}) }),
            prisma.driverProfile.count({ where }),
        ]);
        return pageResult(rows, count, query);
    },
    create(database: Database, data: Prisma.DriverProfileUncheckedCreateInput) { return database.driverProfile.create({ data }); },
    async update(database: Database, schoolId: string, id: string, data: Prisma.DriverProfileUncheckedUpdateInput) {
        await database.driverProfile.updateMany({ where: { schoolId, id }, data });
        return database.driverProfile.findFirstOrThrow({ where: { schoolId, id } });
    },
    async link(database: Database, schoolId: string, id: string, accountId: string) {
        const result = await database.driverProfile.updateMany({ where: { schoolId, id, accountId: null, deletedAt: null }, data: { accountId } });
        return result.count ? database.driverProfile.findFirstOrThrow({ where: { schoolId, id } }) : null;
    },
};
