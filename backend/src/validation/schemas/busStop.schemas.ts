import {z} from "zod";

export const busStopIdParamSchema = z.object({
    id: z.string().min(1),
});

export const getAllBusStopsQuerySchema = z.object({
    search: z.string().optional(),
    isSchoolStop: z.enum(["true", "false"]).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
});

export const upsertBusStopBodySchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    isSchoolStop: z.boolean().optional(),
});
