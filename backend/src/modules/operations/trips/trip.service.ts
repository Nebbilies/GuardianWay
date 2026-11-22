import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { transaction, type Database } from "../../../config/database";
import {
    ConflictError,
    NotFoundError,
    ValidationError,
} from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import {
    dateValue,
    dateText,
    timeText,
    schoolInstant,
    schoolDateAt,
} from "../../../utils/school-time";
import { readSchool } from "../../system/schools";
import { requirePolicy } from "../../system/school-policies";
import { requireActiveSchedule } from "../../planning/schedules";
import { requireApprovedRoute } from "../../planning/route-plans";
import { requireVehicle } from "../../records/vehicles";
import { requireDriver } from "../../records/drivers";
import { requireActiveStops } from "../../planning/stops";
import { recordAudit, type RequestMetadata } from "../../system/audit";
import { tripRepository } from "./trip.repository";
import { tripBody, tripPatch, cancelBody, tripQuery } from "./trip.contracts";
type Trip = NonNullable<Awaited<ReturnType<typeof tripRepository.find>>>;
function view<T extends { serviceDate: Date }>(row: T) {
    return {
        ...row,
        serviceDate: dateText(row.serviceDate),
        passengerManifestPrepared: false,
    };
}
async function schoolTimezone(schoolId: string, database: Database) {
    const school = await readSchool(schoolId, database, true);
    if (!school) {
        throw new NotFoundError("School not found");
    }
    if (school.deletedAt || school.status !== "ACTIVE") {
        throw new ConflictError("School is not active");
    }
    return school.timezone;
}
async function checkPolicy(
    database: Database,
    schoolId: string,
    policyId: string | null,
    direction: string,
    date: string,
    timezone: string,
    start: Date,
    times: Date[],
) {
    if (!policyId) {
        throw new ValidationError("Operating policy is required");
    }
    const policy = await requirePolicy(schoolId, policyId, database);
    if (
        start < policy.effectiveFrom ||
        (policy.effectiveTo && start >= policy.effectiveTo)
    ) {
        throw new ValidationError(
            "Policy does not apply at the planned trip start",
        );
    }
    if (
        !times.length ||
        start > times[0]! ||
        times.some((time) => schoolDateAt(time, timezone) !== date)
    ) {
        throw new ValidationError(
            "Trip preparation must stay within one school-local service day",
        );
    }
    const boundary =
        direction === "PICKUP"
            ? policy.pickupArrivalTime
            : policy.dropoffDepartureTime;
    if (!boundary) {
        throw new ValidationError(
            "School arrival/departure time is not configured",
        );
    }
    const instant = schoolInstant(date, timeText(boundary), timezone);
    if (
        direction === "PICKUP"
            ? times[times.length - 1]! > instant
            : times[0]! < instant
    ) {
        throw new ValidationError(
            "School arrival/departure time is not satisfied",
        );
    }
}
function planned(before: Trip, version: number) {
    if (before.status !== "PLANNED") {
        throw new ConflictError(
            "Only planned trips can be changed",
            "TRIP_NOT_PLANNED",
        );
    }
    if (before.dataVersion !== version) {
        throw new ConflictError(
            "Trip changed; reload before continuing",
            "TRIP_VERSION_CONFLICT",
        );
    }
}
export const tripService = {
    async list(actor: Principal, query: z.infer<typeof tripQuery>) {
        const page = await tripRepository.list(
            requireSchoolAdmin(actor).schoolId,
            query,
        );
        return { ...page, data: page.data.map(view) };
    },
    async get(actor: Principal, id: string) {
        const row = await transaction(
            (database) =>
                tripRepository.find(
                    requireSchoolAdmin(actor).schoolId,
                    id,
                    database,
                ),
            "RepeatableRead",
        );
        if (!row) {
            throw new NotFoundError("Trip not found");
        }
        return view(row);
    },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = tripBody.parse(input);
        return transaction(async (database) => {
            const schedule = await requireActiveSchedule(
                schoolId,
                data.scheduleId,
                data.serviceDate,
                database,
            );
            const { route, plan, stops } = await requireApprovedRoute(
                    schoolId,
                    schedule.routeId,
                    database,
                ),
                date = dateValue(data.serviceDate);
            if (
                schedule.direction !== plan.direction ||
                !plan.effectiveFrom ||
                date < plan.effectiveFrom ||
                (plan.effectiveTo && date > plan.effectiveTo)
            ) {
                throw new ValidationError(
                    "Plan does not apply to this trip date and direction",
                );
            }
            const timezone = await schoolTimezone(schoolId, database),
                plannedStartAt = schoolInstant(
                    data.serviceDate,
                    timeText(schedule.plannedStartTime),
                    timezone,
                );
            const times = stops.map((stop) =>
                schoolInstant(
                    data.serviceDate,
                    timeText(stop.plannedTime),
                    timezone,
                ),
            );
            await checkPolicy(
                database,
                schoolId,
                plan.policyVersionId,
                plan.direction,
                data.serviceDate,
                timezone,
                plannedStartAt,
                times,
            );
            const vehicle = await requireVehicle(
                schoolId,
                data.vehicleId ?? schedule.defaultVehicleId ?? route.vehicleId,
                database,
            );
            const driverId = data.driverId ?? schedule.defaultDriverId;
            if (!driverId) {
                throw new ValidationError(
                    "Assign a driver before preparing this trip",
                );
            }
            const driver = await requireDriver(schoolId, driverId, database);
            await requireActiveStops(
                database,
                schoolId,
                stops.map((stop) => stop.stopId),
                true,
            );
            const row = await tripRepository.create(database, {
                schoolId,
                scheduleId: schedule.id,
                scheduleKey: schedule.scheduleKey,
                serviceDate: date,
                direction: schedule.direction,
                plannedStartAt,
                initialVehicleId: vehicle.id,
                initialDriverId: driver.id,
                operatingPolicyId: plan.policyVersionId,
                status: "PLANNED",
                dataVersion: 1,
            });
            for (const [index, stop] of stops.entries()) {
                await tripRepository.createStop(database, {
                    schoolId,
                    tripId: row.id,
                    logicalStopKey: randomUUID(),
                    versionNo: 1,
                    plannedStopId: stop.id,
                    stopId: stop.stopId,
                    sequenceNo: stop.sequenceNo,
                    plannedAt: times[index]!,
                    stopSnapshot: stop.stopSnapshot!,
                    effectiveFrom: row.createdAt,
                    changedById: actor.accountId,
                });
            }
            const after = (await tripRepository.find(
                schoolId,
                row.id,
                database,
            ))!;
            await recordAudit(
                database,
                actor,
                {
                    action: "trip.prepared",
                    subjectKind: "TRIP",
                    subjectReference: row.id,
                    after,
                },
                metadata,
            );
            return view(after);
        });
    },
    async update(
        actor: Principal,
        id: string,
        input: unknown,
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = tripPatch.parse(input);
        return transaction(async (database) => {
            const before = await tripRepository.find(schoolId, id, database);
            if (!before) {
                throw new NotFoundError("Trip not found");
            }
            planned(before, data.expectedDataVersion);
            const timezone = await schoolTimezone(schoolId, database),
                date = dateText(before.serviceDate);
            const plannedStartAt = data.plannedStartTime
                ? schoolInstant(date, data.plannedStartTime, timezone)
                : before.plannedStartAt;
            const delta =
                    plannedStartAt.getTime() - before.plannedStartAt.getTime(),
                times = before.stops.map(
                    (stop) => new Date(stop.plannedAt.getTime() + delta),
                );
            await checkPolicy(
                database,
                schoolId,
                before.operatingPolicyId,
                before.direction,
                date,
                timezone,
                plannedStartAt,
                times,
            );
            if (data.vehicleId) {
                await requireVehicle(schoolId, data.vehicleId, database);
            }
            if (data.driverId) {
                await requireDriver(schoolId, data.driverId, database);
            }
            const result = await tripRepository.compareAndSet(
                database,
                schoolId,
                id,
                data.expectedDataVersion,
                {
                    plannedStartAt,
                    initialVehicleId: data.vehicleId,
                    initialDriverId: data.driverId,
                },
            );
            if (result.count !== 1) {
                throw new ConflictError(
                    "Trip changed; reload before continuing",
                    "TRIP_VERSION_CONFLICT",
                );
            }
            if (delta) {
                const at = new Date(
                    Math.max(
                        Date.now(),
                        ...before.stops.map(
                            (stop) => stop.effectiveFrom.getTime() + 1,
                        ),
                    ),
                );
                for (const [index, stop] of before.stops.entries()) {
                    await tripRepository.closeStop(
                        database,
                        schoolId,
                        id,
                        stop.id,
                        at,
                    );
                    await tripRepository.createStop(database, {
                        schoolId,
                        tripId: id,
                        logicalStopKey: stop.logicalStopKey,
                        versionNo: stop.versionNo + 1,
                        previousStopId: stop.id,
                        plannedStopId: stop.plannedStopId,
                        stopId: stop.stopId,
                        sequenceNo: stop.sequenceNo,
                        plannedAt: times[index]!,
                        stopSnapshot: stop.stopSnapshot!,
                        effectiveFrom: at,
                        changedById: actor.accountId,
                        changeReason: "Preparation start time changed",
                    });
                }
            }
            const after = (await tripRepository.find(schoolId, id, database))!;
            await recordAudit(
                database,
                actor,
                {
                    action: "trip.preparation_updated",
                    subjectKind: "TRIP",
                    subjectReference: id,
                    before,
                    after,
                },
                metadata,
            );
            return view(after);
        });
    },
    async cancel(
        actor: Principal,
        id: string,
        input: unknown,
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = cancelBody.parse(input);
        return transaction(async (database) => {
            const before = await tripRepository.find(schoolId, id, database);
            if (!before) {
                throw new NotFoundError("Trip not found");
            }
            planned(before, data.expectedDataVersion);
            const result = await tripRepository.compareAndSet(
                database,
                schoolId,
                id,
                data.expectedDataVersion,
                {
                    status: "CANCELLED",
                    cancelledAt: new Date(),
                    cancelledById: actor.accountId,
                    cancellationReason: data.reason,
                },
            );
            if (result.count !== 1) {
                throw new ConflictError(
                    "Trip changed; reload before continuing",
                    "TRIP_VERSION_CONFLICT",
                );
            }
            const after = (await tripRepository.find(schoolId, id, database))!;
            await recordAudit(
                database,
                actor,
                {
                    action: "trip.cancelled",
                    subjectKind: "TRIP",
                    subjectReference: id,
                    before,
                    after,
                    reason: data.reason,
                },
                metadata,
            );
            return view(after);
        });
    },
};
