import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { deletedFilter, listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
export const stopRepository = {
    find(schoolId: string, id: string, database: Database = prisma) { return database.stop.findFirst({ where: { schoolId, id } }); },
    async list(schoolId: string, query: ListQuery & { status?: string }, exportAll = false) {
        const where: Prisma.StopWhereInput = { schoolId, deletedAt: deletedFilter(query), status: query.status, ...(query.search ? { OR: [{ code: { contains: query.search, mode: "insensitive" } }, { name: { contains: query.search, mode: "insensitive" } }, { address: { contains: query.search, mode: "insensitive" } }] } : {}) };
        const [rows, count] = await Promise.all([
            prisma.stop.findMany({ where, ...listOptions(query, ["code", "name", "createdAt", "status"], "-createdAt"), ...(exportAll ? { skip: undefined, take: undefined } : {}) }),
            prisma.stop.count({ where }),
        ]);
        return pageResult(rows, count, query);
    },
    create(database: Database, data: Prisma.StopUncheckedCreateInput) { return database.stop.create({ data }); },
    async update(database: Database, schoolId: string, id: string, data: Prisma.StopUncheckedUpdateInput) {
        await database.stop.updateMany({ where: { schoolId, id }, data });
        return database.stop.findFirstOrThrow({ where: { schoolId, id } });
    },
};
