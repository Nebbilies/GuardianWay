import { z } from "zod";

export const schoolIdParamSchema = z.object({
    id: z.string().min(1),
});

export const getAllSchoolsQuerySchema = z.object({
    search: z.string().optional(),
    deleted: z.enum(["exclude", "only"]).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
});

export const createSchoolBodySchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    slug: z.string().optional(),
});

export const updateSchoolBodySchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    slug: z.string().min(1),
    isActive: z.boolean(),
});

export const onboardAdminBodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
});
