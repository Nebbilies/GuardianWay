import { z } from "zod";
import { businessCode, profileStatus } from "../../../http/normalization";
export const studentBody = z
    .object({
        studentCode: businessCode,
        fullName: z.string().trim().min(1).max(200),
        classLabel: z.string().trim().max(100).nullable().optional(),
        status: profileStatus.default("ACTIVE"),
    })
    .strict();
export const studentPatch = studentBody
    .partial()
    .extend({ status: profileStatus.optional() })
    .strict();
export type StudentInput = z.infer<typeof studentBody>;

import { listQuerySchema } from "../../../http/contracts/pagination";
export const studentQuery = listQuerySchema.extend({
    status: profileStatus.optional(),
    parentId: z.uuid().optional(),
});
