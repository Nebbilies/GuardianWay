import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
export const planRepository = {
    async find(schoolId: string, id: string, database: Database = prisma) {
        const plan = await database.planVersion.findFirst({ where: { schoolId, id } });
        if (!plan) return null;
        const routes = await database.plannedRoute.findMany({ where: { schoolId, planVersionId: id }, orderBy: { routeCode: "asc" } });
        const stops = await database.plannedStop.findMany({ where: { schoolId, routeId: { in: routes.map(row => row.id) } }, orderBy: { sequenceNo: "asc" } });
        return { ...plan, routes: routes.map(row => ({ ...row, stops: stops.filter(stop => stop.routeId === row.id) })) };
    },
    route(schoolId: string, id: string, database: Database = prisma) { return database.plannedRoute.findFirst({ where: { schoolId, id } }); },
    async list(schoolId: string, query: ListQuery & { direction?: string; status?: string }) {
        const where = { schoolId, direction: query.direction, status: query.status };
        const [rows, count] = await Promise.all([prisma.planVersion.findMany({ where, ...listOptions(query, ["createdAt", "versionNo", "referenceDate", "status"], "-createdAt") }), prisma.planVersion.count({ where })]);
        return pageResult(await Promise.all(rows.map(row => planRepository.find(schoolId, row.id))), count, query);
    },
    async lock(database: Database, schoolId: string, id: string) { await database.$queryRaw`SELECT id FROM plan_version WHERE school_id = ${schoolId}::uuid AND id = ${id}::uuid FOR UPDATE`; },
    latest(database: Database, schoolId: string, planKey: string) { return database.planVersion.findFirst({ where: { schoolId, planKey }, orderBy: { versionNo: "desc" } }); },
    create(database: Database, data: Prisma.PlanVersionUncheckedCreateInput) { return database.planVersion.create({ data }); },
    update(database: Database, schoolId: string, id: string, data: Prisma.PlanVersionUncheckedUpdateInput) { return database.planVersion.updateMany({ where: { schoolId, id }, data }); },
    async clearRoutes(database: Database, schoolId: string, planVersionId: string) {
        const routes = await database.plannedRoute.findMany({ where: { schoolId, planVersionId }, select: { id: true } });
        await database.plannedStop.deleteMany({ where: { schoolId, routeId: { in: routes.map(row => row.id) } } });
        await database.plannedRoute.deleteMany({ where: { schoolId, planVersionId } });
    },
    createRoute(database: Database, data: Prisma.PlannedRouteUncheckedCreateInput) { return database.plannedRoute.create({ data }); },
    createStop(database: Database, data: Prisma.PlannedStopUncheckedCreateInput) { return database.plannedStop.create({ data }); },
};
