import { z } from "zod";
export const problemSchema = z.object({
    type: z.url(), title: z.string(), status: z.number().int(), code: z.string(), detail: z.string(),
    instance: z.string(), traceId: z.string(), timestamp: z.iso.datetime(),
    errors: z.array(z.object({ field: z.string(), message: z.string(), code: z.string().optional() })).optional(),
});
