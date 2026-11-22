import { z } from "zod";
import {
    instant,
    localTime,
    parseInput,
    callApi,
    type ApiCall,
} from "@/lib/http/contracts";
export const policyInput = z
    .object({
        effectiveFrom: instant,
        effectiveTo: instant.nullable().optional(),
        pickupArrivalTime: localTime.nullable().optional(),
        dropoffDepartureTime: localTime.nullable().optional(),
        rideWarningMinutes: z.number().positive().nullable().optional(),
        pickupWaitMinutes: z.number().nonnegative().nullable().optional(),
        gpsStaleSeconds: z.number().int().positive().nullable().optional(),
        historyRetentionDays: z.number().int().positive().nullable().optional(),
        approvalBasis: z.string().trim().min(1),
    })
    .strict();
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
export type Policy = z.infer<typeof policySchema>;
export function createPolicyRequest(input: unknown): ApiCall {
    return {
        path: "/school-policies",
        method: "POST",
        body: parseInput(policyInput, input),
    };
}
export const policyApi = {
    list: () =>
        callApi(
            { path: "/school-policies", method: "GET" },
            z.array(policySchema),
        ),
    create: (input: unknown) =>
        callApi(createPolicyRequest(input), policySchema),
};
