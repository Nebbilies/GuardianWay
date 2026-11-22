import { z } from "zod";
import { instant, localDate, localTime } from "../../../http/contracts/values";

export const stopSnapshotSchema = z.object({
    code: z.string(),
    name: z.string(),
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    kind: z.string(),
    accessNote: z.string().nullable().optional(),
});
export const plannedStopSchema = z.object({
    id: z.uuid(),
    stopId: z.uuid(),
    sequenceNo: z.number().int().positive(),
    plannedTime: localTime,
    stopSnapshot: stopSnapshotSchema,
});
export const plannedRouteSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    planVersionId: z.uuid(),
    routeCode: z.string(),
    label: z.string(),
    vehicleId: z.uuid(),
    capacitySnapshot: z.number().int().positive(),
    distanceMetres: z.number().nonnegative(),
    durationSeconds: z.number().int().positive(),
    stops: z.array(plannedStopSchema),
});
export const planSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    planKey: z.uuid(),
    versionNo: z.number().int().positive(),
    previousVersionId: z.uuid().nullable(),
    referenceDate: localDate,
    direction: z.enum(["PICKUP", "DROPOFF"]),
    policyVersionId: z.uuid(),
    status: z.enum(["DRAFT", "APPROVED"]),
    approvalToken: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .nullable(),
    effectiveFrom: localDate.nullable(),
    effectiveTo: localDate.nullable(),
    pickupArrivalDeadline: localTime.nullable(),
    dropoffDepartureTime: localTime.nullable(),
    source: z.literal("MANUAL"),
    passengerPlanningComplete: z.literal(false),
    routes: z.array(plannedRouteSchema),
    createdAt: instant,
    updatedAt: instant,
    approvedAt: instant.nullable(),
    approvedById: z.uuid().nullable(),
});
