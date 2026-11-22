import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import {
    deletedFilter,
    listOptions,
    pageResult,
    type ListQuery,
} from "../../../http/contracts/pagination";
export const studentRepository = {
    find(schoolId: string, id: string, database: Database = prisma) {
        return database.student.findFirst({ where: { id, schoolId } });
    },
    async list(
        schoolId: string,
        query: ListQuery & { status?: string; parentId?: string },
        exportAll = false,
    ) {
        const where: Prisma.StudentWhereInput = {
            schoolId,
            deletedAt: deletedFilter(query),
            status: query.status,
            GuardianLinkByStudentId: query.parentId
                ? {
                      some: {
                          schoolId,
                          guardianAccountId: query.parentId,
                          effectiveTo: null,
                      },
                  }
                : undefined,
            ...(query.search
                ? {
                      OR: [
                          {
                              fullName: {
                                  contains: query.search,
                                  mode: "insensitive",
                              },
                          },
                          {
                              studentCode: {
                                  contains: query.search,
                                  mode: "insensitive",
                              },
                          },
                      ],
                  }
                : {}),
        };
        const [rows, count] = await Promise.all([
            prisma.student.findMany({
                where,
                ...listOptions(
                    query,
                    ["studentCode", "fullName", "createdAt", "status"],
                    "-createdAt",
                ),
                ...(exportAll ? { skip: undefined, take: undefined } : {}),
            }),
            prisma.student.count({ where }),
        ]);
        return exportAll
            ? pageResult(rows, rows.length, {
                  page: 1,
                  limit: Math.max(1, rows.length),
              })
            : pageResult(rows, count, query);
    },
    create(database: Database, data: Prisma.StudentUncheckedCreateInput) {
        return database.student.create({ data });
    },
    async update(
        database: Database,
        schoolId: string,
        id: string,
        data: Prisma.StudentUncheckedUpdateInput,
    ) {
        await database.student.updateMany({ where: { schoolId, id }, data });
        return database.student.findFirstOrThrow({ where: { schoolId, id } });
    },
    async lock(database: Database, schoolId: string, id: string) {
        await database.$queryRaw`SELECT id FROM student WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR UPDATE`;
    },
};
