import { z } from "zod";
import { businessCode, direction } from "../../../http/normalization";
import { listQuerySchema } from "../../../http/contracts/pagination";
import { localDateSchema, localTimeSchema } from "../../../utils/school-time";
const resourceId = z.uuid().transform((id) => id.toLowerCase());
export const planBody = z
    .object({
        referenceDate: localDateSchema,
        direction,
        policyVersionId: z.uuid(),
        effectiveFrom: localDateSchema,
        effectiveTo: localDateSchema.nullable().optional(),
        routes: z
            .array(
                z
                    .object({
                        routeCode: businessCode,
                        label: z.string().trim().min(1).max(200),
                        vehicleId: resourceId,
                        distanceMetres: z.number().finite().positive(),
                        durationSeconds: z.number().int().positive(),
                        stops: z
                            .array(
                                z
                                    .object({
                                        stopId: resourceId,
                                        plannedTime: localTimeSchema,
                                    })
                                    .strict(),
                            )
                            .min(2)
                            .max(100),
                    })
                    .strict(),
            )
            .min(1)
            .max(50),
    })
    .strict()
    .refine(
        (data) => !data.effectiveTo || data.effectiveTo > data.effectiveFrom,
        "Invalid plan validity interval",
    );
export const planApprovalBody = z
    .object({ approvalToken: z.string().regex(/^[a-f0-9]{64}$/) })
    .strict();
export const planQuery = listQuerySchema.extend({
    direction: direction.optional(),
    status: z.enum(["DRAFT", "APPROVED"]).optional(),
});
export type PlanInput = z.infer<typeof planBody>;
