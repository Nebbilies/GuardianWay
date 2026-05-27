import {z} from "zod";

export const busRouteIdParamSchema = z.object({
    id: z.string().min(1),
});

export const getAllBusRoutesQuerySchema = z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
});

const routeStopSchema = z.object({
    stopId: z.string().min(1),
    stopOrder: z.number().int().nonnegative(),
    scheduledTime: z.coerce.date().nullish(),
});

export const upsertBusRouteBodySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    stops: z.array(routeStopSchema).min(2, "Tuyến đường phải có ít nhất 2 trạm dừng"),
});
