import { z } from "zod";
import { localTimeSchema } from "../../../utils/school-time";
export const policyBody = z.object({
    effectiveFrom: z.iso.datetime({ offset: true }), effectiveTo: z.iso.datetime({ offset: true }).nullable().optional(),
    pickupArrivalTime: localTimeSchema.nullable().optional(), dropoffDepartureTime: localTimeSchema.nullable().optional(),
    rideWarningMinutes: z.number().finite().positive().nullable().optional(), pickupWaitMinutes: z.number().finite().nonnegative().nullable().optional(),
    gpsStaleSeconds: z.number().int().positive().nullable().optional(), historyRetentionDays: z.number().int().positive().nullable().optional(),
    approvalBasis: z.string().trim().min(1).max(1000),
}).strict().refine(data => !data.effectiveTo || new Date(data.effectiveTo) > new Date(data.effectiveFrom), "Invalid policy validity interval");
