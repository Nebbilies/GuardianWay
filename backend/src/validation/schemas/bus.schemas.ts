import {z} from "zod";
import {BusStatus} from "@prisma/client";

export const busIdParamSchema = z.object({
    id: z.string().min(1),
});

export const getAllBusesQuerySchema = z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    status: z.nativeEnum(BusStatus).optional(),
});

export const createBusBodySchema = z.object({
    licensePlate: z.string().min(1),
    model: z.string().min(1),
    capacity: z.number().int().positive(),
    status: z.nativeEnum(BusStatus),
});

export const updateBusBodySchema = z
    .object({
        licensePlate: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        capacity: z.number().int().positive().optional(),
        status: z.nativeEnum(BusStatus).optional(),
    })
    .strict();
