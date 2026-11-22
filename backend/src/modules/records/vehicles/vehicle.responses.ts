import { z } from "zod";
import { timestamps } from "../../../http/contracts/values";
import { resourceStatus } from "../../../http/normalization";

export const vehicleSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    code: z.string(),
    plateNumber: z.string(),
    studentCapacity: z.number().int().positive(),
    status: resourceStatus,
    description: z.string().nullable(),
    ...timestamps,
});
