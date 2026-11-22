import { z } from "zod";
import { timestamps } from "../../../http/contracts/values";
import { resourceStatus } from "../../../http/normalization";

export const driverSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    code: z.string(),
    fullName: z.string(),
    phone: z.string(),
    status: resourceStatus,
    notes: z.string().nullable(),
    accountId: z.uuid().nullable(),
    ...timestamps,
});
