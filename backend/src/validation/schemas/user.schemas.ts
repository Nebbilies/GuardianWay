import {z} from "zod";
import {Role} from "@prisma/client";

const roleEnum = z.nativeEnum(Role);

export const userIdParamSchema = z.object({
    id: z.string().min(1),
});

export const getAllUsersQuerySchema = z.object({
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
    role: roleEnum.optional(),
    deleted: z.enum(["exclude", "only", "include"]).optional(),
});

export const createUserBodySchema = z
    .object({
        name: z.string().min(1),
        email: z.string().email(),
        role: roleEnum,
        phoneNumber: z.string().optional(),
        address: z.string().optional(),
        licenseNumber: z.string().optional(),
    })
    .strict()
    .refine(
        (data) => data.role !== "DRIVER" || !!data.licenseNumber,
        {message: "Thiếu thông tin giấy phép lái xe", path: ["licenseNumber"]},
    );

export const updateUserBodySchema = z
    .object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        password: z.string().optional(),
        role: roleEnum.optional(),
        phoneNumber: z.string().optional(),
        address: z.string().optional(),
        licenseNumber: z.string().optional(),
    })
    .strict();
