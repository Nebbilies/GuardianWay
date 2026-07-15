import {z} from "zod";
import {BusTripStatus, TripType} from "@prisma/client";

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
    tripType: z.nativeEnum(TripType).optional(),
    date: z.string().regex(dateRegex).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
});

export const upsertBusTripBodySchema = z
    .object({
        routeId: z.string().min(1),
        busId: z.string().min(1),
        driverId: z.string().min(1),
        tripType: z.nativeEnum(TripType),
        scheduledStartTime: z.string().datetime({offset: true, message: "Giờ bắt đầu không hợp lệ"}),
        scheduledEndTime: z.string().datetime({offset: true, message: "Giờ kết thúc không hợp lệ"}),
        status: z.nativeEnum(BusTripStatus).optional(),
    })
    .refine(
        (data) => new Date(data.scheduledEndTime).getTime() > new Date(data.scheduledStartTime).getTime(),
        {message: "Giờ kết thúc phải sau giờ bắt đầu", path: ["scheduledEndTime"]},
    );
