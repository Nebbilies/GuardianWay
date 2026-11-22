import { z } from "zod";
import { timestamps } from "../../../http/contracts/values";
import { profileStatus } from "../../../http/normalization";

export const stopSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    code: z.string(),
    name: z.string(),
    address: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    kind: z.enum(["SERVICE_POINT", "SCHOOL"]),
    allowsPickup: z.boolean(),
    allowsDropoff: z.boolean(),
    status: profileStatus,
    accessNote: z.string().nullable(),
    ...timestamps,
});
