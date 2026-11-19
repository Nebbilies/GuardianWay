import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
export const scheduleRepository = {
    async find(schoolId: string, id: string, database: Database = prisma) {
        const row = await database.recurringSchedule.findFirst({ where: { schoolId, id }, include: { routeIdRef: { select: { planVersionId: true, routeCode: true, label: true } } } });
        if (!row) return null;
        const weekdays = await database.scheduleWeekday.findMany({ where: { schoolId, scheduleId: id }, orderBy: { isoWeekday: "asc" } });
        const { routeIdRef: route, ...schedule } = row;
        return { ...schedule, planVersionId: route.planVersionId, routeLabel: route.routeCode + " · " + route.label, weekdays: weekdays.map(day => day.isoWeekday) };
    },
    async list(schoolId: string, query: ListQuery & { status?: string }) {
        const where = { schoolId, status: query.status };
        const [rows, count] = await Promise.all([prisma.recurringSchedule.findMany({ where, ...listOptions(query, ["createdAt", "effectiveFrom", "versionNo", "status"], "-createdAt") }), prisma.recurringSchedule.count({ where })]);
        return pageResult(await Promise.all(rows.map(row => scheduleRepository.find(schoolId, row.id))), count, query);
    },
    latest(database: Database, schoolId: string, scheduleKey: string) { return database.recurringSchedule.findFirst({ where: { schoolId, scheduleKey }, orderBy: { versionNo: "desc" } }); },
    async lock(database: Database, schoolId: string, id: string) { await database.$queryRaw`SELECT id FROM recurring_schedule WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR UPDATE`; },
    create(database: Database, data: Prisma.RecurringScheduleUncheckedCreateInput) { return database.recurringSchedule.create({ data }); },
    update(database: Database, schoolId: string, id: string, data: Prisma.RecurringScheduleUncheckedUpdateInput) { return database.recurringSchedule.updateMany({ where: { schoolId, id }, data }); },
    async weekdays(database: Database, schoolId: string, scheduleId: string, values: number[]) {
        await database.scheduleWeekday.deleteMany({ where: { schoolId, scheduleId } });
        await database.scheduleWeekday.createMany({ data: values.map(isoWeekday => ({ schoolId, scheduleId, isoWeekday })) });
    },
};
