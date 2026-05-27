import {z} from "zod";
import {BusTripStatus} from "@prisma/client";

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}/;

export const busTripIdParamSchema = z.object({
    id: z.string().min(1),
});

export const getAllBusTripsQuerySchema = z.object({
    search: z.string().optional(),
    status: z.nativeEnum(BusTripStatus).optional(),
    routeId: z.string().optional(),
    busId: z.string().optional(),
    driverId: z.string().optional(),
    date: z.string().regex(dateRegex).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
});

export const upsertBusTripBodySchema = z.object({
    routeId: z.string().min(1),
    busId: z.string().min(1),
    driverId: z.string().min(1),
    date: z.string().regex(dateRegex, "Ngày chạy không hợp lệ"),
    startTime: z.string().regex(timeRegex, "Giờ bắt đầu không hợp lệ"),
    endTime: z.string().regex(timeRegex, "Giờ kết thúc không hợp lệ").nullish(),
    status: z.nativeEnum(BusTripStatus).optional(),
});
