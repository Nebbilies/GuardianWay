import { z } from "zod";
import { instant, localDate } from "../../../http/contracts/values";
import { stopSnapshotSchema } from "../../planning/route-plans";

export const tripStopSchema = z.object({
    id: z.uuid(),
    logicalStopKey: z.uuid(),
    versionNo: z.number().int().positive(),
    previousStopId: z.uuid().nullable(),
    stopId: z.uuid(),
    sequenceNo: z.number().int().positive(),
    plannedAt: instant,
    stopSnapshot: stopSnapshotSchema,
    effectiveFrom: instant,
    effectiveTo: instant.nullable(),
});
export const tripSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    scheduleId: z.uuid(),
    scheduleKey: z.uuid(),
    serviceDate: localDate,
    direction: z.enum(["PICKUP", "DROPOFF"]),
    status: z.enum(["PLANNED", "OPEN", "COMPLETED", "CANCELLED"]),
    dataVersion: z.number().int().positive(),
    plannedStartAt: instant,
    initialVehicleId: z.uuid().nullable(),
    initialDriverId: z.uuid().nullable(),
    vehicleLabel: z.string().nullable(),
    driverLabel: z.string().nullable(),
    operatingPolicyId: z.uuid().nullable(),
    cancellationReason: z.string().nullable(),
    cancelledAt: instant.nullable(),
    passengerManifestPrepared: z.literal(false),
    createdAt: instant,
    updatedAt: instant,
});
export const tripDetailSchema = tripSchema.extend({
    stops: z.array(tripStopSchema),
    stopHistory: z.array(tripStopSchema),
});
