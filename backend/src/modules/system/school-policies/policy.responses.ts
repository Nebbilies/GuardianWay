import { z } from "zod";
import { instant, localTime } from "../../../http/contracts/values";
export const policySchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    versionNo: z.number().int().positive(),
    previousVersionId: z.uuid().nullable(),
    effectiveFrom: instant,
    effectiveTo: instant.nullable(),
    pickupArrivalTime: localTime.nullable(),
    dropoffDepartureTime: localTime.nullable(),
    rideWarningMinutes: z.number().nullable(),
    pickupWaitMinutes: z.number().nullable(),
    gpsStaleSeconds: z.number().int().nullable(),
    historyRetentionDays: z.number().int().nullable(),
    status: z.literal("APPROVED"),
    approvalBasis: z.string().nullable(),
    approvedAt: instant.nullable(),
    approvedById: z.uuid().nullable(),
    createdAt: instant,
    updatedAt: instant,
});
