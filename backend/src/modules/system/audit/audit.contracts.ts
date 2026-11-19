import { z } from "zod";
import { listQuerySchema } from "../../../http/contracts/pagination";
export const auditQuery = listQuerySchema.extend({
    action: z.string().max(100).optional(), actorId: z.uuid().optional(),
    targetType: z.string().max(80).optional(), targetId: z.string().max(100).optional(),
    schoolId: z.uuid().optional(), from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional(),
});
export type AuditQuery = z.infer<typeof auditQuery>;
