import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { deletedFilter, listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
export const stopRepository = {
    async lock(database: Database, schoolId: string, id: string) { await database.$queryRaw`SELECT id FROM stop WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR UPDATE`; },
    async findForPlan(database: Database, schoolId: string, ids: string[], lock: boolean) {
        if (!ids.length) return [];
        if (lock) {
            await database.$queryRaw`SELECT id FROM stop WHERE school_id = ${schoolId}::uuid
                AND id IN (${Prisma.join(ids.map(id => Prisma.sql`${id}::uuid`))}) ORDER BY id FOR SHARE`;
        }
        return database.stop.findMany({ where: { schoolId, id: { in: ids }, deletedAt: null, status: "ACTIVE" } });
    },
    find(schoolId: string, id: string, database: Database = prisma) { return database.stop.findFirst({ where: { schoolId, id } }); },
    async list(schoolId: string, query: ListQuery & { status?: string }, exportAll = false) {
        const where: Prisma.StopWhereInput = { schoolId, deletedAt: deletedFilter(query), status: query.status, ...(query.search ? { OR: [{ code: { contains: query.search, mode: "insensitive" } }, { name: { contains: query.search, mode: "insensitive" } }, { address: { contains: query.search, mode: "insensitive" } }] } : {}) };
        const [rows, count] = await Promise.all([
            prisma.stop.findMany({ where, ...listOptions(query, ["code", "name", "createdAt", "status"], "-createdAt"), ...(exportAll ? { skip: undefined, take: undefined } : {}) }),
            prisma.stop.count({ where }),
        ]);
        return exportAll ? pageResult(rows, rows.length, { page: 1, limit: Math.max(1, rows.length) }) : pageResult(rows, count, query);
    },
    create(database: Database, data: Prisma.StopUncheckedCreateInput) { return database.stop.create({ data }); },
    async update(database: Database, schoolId: string, id: string, data: Prisma.StopUncheckedUpdateInput) {
        await database.stop.updateMany({ where: { schoolId, id }, data });
        return database.stop.findFirstOrThrow({ where: { schoolId, id } });
    },
};
