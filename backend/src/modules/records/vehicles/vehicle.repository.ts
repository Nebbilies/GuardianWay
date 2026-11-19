import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { deletedFilter, listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
export const vehicleRepository = {
    find(schoolId: string, id: string, database: Database = prisma) { return database.vehicle.findFirst({ where: { schoolId, id } }); },
    async list(schoolId: string, query: ListQuery & { status?: string }, exportAll = false) {
        const where: Prisma.VehicleWhereInput = { schoolId, deletedAt: deletedFilter(query), status: query.status, ...(query.search ? { OR: [{ code: { contains: query.search, mode: "insensitive" } }, { plateNumber: { contains: query.search, mode: "insensitive" } }] } : {}) };
        const [rows, count] = await Promise.all([
            prisma.vehicle.findMany({ where, ...listOptions(query, ["code", "plateNumber", "createdAt", "status"], "-createdAt"), ...(exportAll ? { skip: undefined, take: undefined } : {}) }),
            prisma.vehicle.count({ where }),
        ]);
        return pageResult(rows, count, query);
    },
    create(database: Database, data: Prisma.VehicleUncheckedCreateInput) { return database.vehicle.create({ data }); },
    async update(database: Database, schoolId: string, id: string, data: Prisma.VehicleUncheckedUpdateInput) {
        await database.vehicle.updateMany({ where: { schoolId, id }, data });
        return database.vehicle.findFirstOrThrow({ where: { schoolId, id } });
    },
};
