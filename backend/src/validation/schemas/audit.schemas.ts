import { z } from "zod";

export const getAuditLogsQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    action: z.string().optional(),
    actorId: z.string().optional(),
    targetType: z.string().optional(),
    targetId: z.string().optional(),
    schoolId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});
