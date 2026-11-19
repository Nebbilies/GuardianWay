import { Prisma } from "@prisma/client";
import { normalizePlate } from "../../../http/normalization";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { deletedFilter, listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
export const vehicleRepository = {
    async lockForRead(database: Database, schoolId: string, id: string) { await database.$queryRaw`SELECT id FROM vehicle WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR SHARE`; },
    find(schoolId: string, id: string, database: Database = prisma) { return database.vehicle.findFirst({ where: { schoolId, id } }); },
    async list(schoolId: string, query: ListQuery & { status?: string }, exportAll = false) {
        const plate = normalizePlate(query.search ?? "");
        const where: Prisma.VehicleWhereInput = { schoolId, deletedAt: deletedFilter(query), status: query.status, ...(query.search ? { OR: [{ code: { contains: query.search, mode: "insensitive" } }, ...(plate ? [{ plateNumber: { contains: plate } }] : [])] } : {}) };
        const [rows, count] = await Promise.all([
            prisma.vehicle.findMany({ where, ...listOptions(query, ["code", "plateNumber", "createdAt", "status"], "-createdAt"), ...(exportAll ? { skip: undefined, take: undefined } : {}) }),
            prisma.vehicle.count({ where }),
        ]);
        return exportAll ? pageResult(rows, rows.length, { page: 1, limit: Math.max(1, rows.length) }) : pageResult(rows, count, query);
    },
    create(database: Database, data: Prisma.VehicleUncheckedCreateInput) { return database.vehicle.create({ data }); },
    async update(database: Database, schoolId: string, id: string, data: Prisma.VehicleUncheckedUpdateInput) {
        await database.vehicle.updateMany({ where: { schoolId, id }, data });
        return database.vehicle.findFirstOrThrow({ where: { schoolId, id } });
    },
};
