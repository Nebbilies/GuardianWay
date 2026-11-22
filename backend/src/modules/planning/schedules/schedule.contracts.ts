import { z } from "zod";
import { listQuerySchema } from "../../../http/contracts/pagination";
import { localDateSchema, localTimeSchema } from "../../../utils/school-time";
export const scheduleBody = z
    .object({
        routeId: z.uuid(),
        effectiveFrom: localDateSchema,
        effectiveTo: localDateSchema.nullable().optional(),
        weekdays: z
            .array(z.number().int().min(1).max(7))
            .min(1)
            .max(7)
            .refine(
                (values) => new Set(values).size === values.length,
                "Weekdays must be distinct",
            ),
        plannedStartTime: localTimeSchema,
        defaultVehicleId: z.uuid().nullable().optional(),
        defaultDriverId: z.uuid().nullable().optional(),
    })
    .strict()
    .refine(
        (data) => !data.effectiveTo || data.effectiveTo > data.effectiveFrom,
        "Invalid schedule validity interval",
    );
export const scheduleQuery = listQuerySchema.extend({
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
});
