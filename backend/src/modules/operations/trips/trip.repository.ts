import { Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";
import type { Database } from "../../../config/database";
import { listOptions, pageResult, type ListQuery } from "../../../http/contracts/pagination";
const resourceLabels = { initialVehicleIdRef: { select: { code: true, plateNumber: true } }, initialDriverIdRef: { select: { code: true, fullName: true } } } as const;
function labels<T extends { initialVehicleIdRef: { code: string; plateNumber: string } | null; initialDriverIdRef: { code: string; fullName: string } | null }>(row: T) {
    const { initialVehicleIdRef: vehicle, initialDriverIdRef: driver, ...trip } = row;
    return { ...trip, vehicleLabel: vehicle ? vehicle.code + " · " + vehicle.plateNumber : null, driverLabel: driver ? driver.code + " · " + driver.fullName : null };
}
export const tripRepository = {
    async find(schoolId: string, id: string, database: Database = prisma) {
        const trip = await database.trip.findFirst({ where: { schoolId, id }, include: resourceLabels });
        if (!trip) return null;
        const stopHistory = await database.tripStop.findMany({ where: { schoolId, tripId: id }, orderBy: [{ sequenceNo: "asc" }, { versionNo: "desc" }] });
        return { ...labels(trip), stops: stopHistory.filter(stop => !stop.effectiveTo), stopHistory };
    },
    async list(schoolId: string, query: ListQuery & { status?: string; direction?: string; serviceDate?: string }) {
        const where = { schoolId, status: query.status, direction: query.direction, serviceDate: query.serviceDate ? new Date(query.serviceDate + "T00:00Z") : undefined };
        const [rows, count] = await Promise.all([prisma.trip.findMany({ where, include: resourceLabels, ...listOptions(query, ["createdAt", "serviceDate", "plannedStartAt", "status"], "-plannedStartAt") }), prisma.trip.count({ where })]);
        return pageResult(rows.map(labels), count, query);
    },
    create(database: Database, data: Prisma.TripUncheckedCreateInput) { return database.trip.create({ data }); },
    createStop(database: Database, data: Prisma.TripStopUncheckedCreateInput) { return database.tripStop.create({ data }); },
    compareAndSet(database: Database, schoolId: string, id: string, expectedDataVersion: number, data: Prisma.TripUncheckedUpdateInput) {
        return database.trip.updateMany({ where: { schoolId, id, status: "PLANNED", dataVersion: expectedDataVersion }, data: { ...data, dataVersion: { increment: 1 } } });
    },
    closeStop(database: Database, schoolId: string, tripId: string, id: string, effectiveTo: Date) {
        return database.tripStop.updateMany({ where: { schoolId, tripId, id, effectiveTo: null }, data: { effectiveTo } });
    },
};
