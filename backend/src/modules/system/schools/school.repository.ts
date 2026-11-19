import type { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { deletedFilter, listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
import type { CreateSchool, UpdateSchool } from "./school.contracts";

export const schoolRepository = {
    async lock(database: Database, id: string, exclusive: boolean) {
        if (exclusive) await database.$queryRaw`SELECT id FROM school WHERE id = ${id}::uuid FOR UPDATE`;
        else await database.$queryRaw`SELECT id FROM school WHERE id = ${id}::uuid FOR SHARE`;
    },
    preparedTrips(database: Database, schoolId: string) { return database.trip.count({ where: { schoolId, status: "PLANNED" } }); },
    find(id: string, database: Database = prisma) { return database.school.findUnique({ where: { id } }); },
    async list(query: ListQuery) {
        const where: Prisma.SchoolWhereInput = {
            deletedAt: deletedFilter(query),
            ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { code: { contains: query.search, mode: "insensitive" } }] } : {}),
        };
        const [rows, count] = await Promise.all([
            prisma.school.findMany({ where, ...listOptions(query, ["createdAt", "name", "code", "status"], "-createdAt") }),
            prisma.school.count({ where }),
        ]);
        return pageResult(rows, count, query);
    },
    create(database: Database, data: CreateSchool) { return database.school.create({ data }); },
    update(database: Database, id: string, data: UpdateSchool & { deletedAt?: Date | null }) {
        return database.school.update({ where: { id }, data });
    },
    runningTrips(database: Database, schoolId: string) {
        return database.trip.count({ where: { schoolId, status: "OPEN" } });
    },
};
