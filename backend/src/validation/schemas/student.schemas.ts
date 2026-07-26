import {z} from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}/;

export const studentIdParamSchema = z.object({
    id: z.string().min(1),
});

export const getAllStudentsQuerySchema = z.object({
    search: z.string().optional(),
    studentClass: z.string().optional(),
    parentId: z.string().uuid().optional(),
    deleted: z.enum(["exclude", "only", "include"]).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
});

export const createStudentBodySchema = z.object({
    fullName: z.string().min(1),
    studentId: z.string().min(1),
    studentClass: z.string().min(1),
    dateOfBirth: z.string().regex(dateRegex, "Ngày sinh không hợp lệ"),
    parentId: z.string().uuid().nullish(),
}).strict();

export const updateStudentBodySchema = z.object({
    fullName: z.string().min(1).optional(),
    studentId: z.string().min(1).optional(),
    studentClass: z.string().min(1).optional(),
    dateOfBirth: z.string().regex(dateRegex, "Ngày sinh không hợp lệ").optional(),
    parentId: z.string().uuid().nullish(),
}).strict();

export const assignCardBodySchema = z.object({
    // raw card id from the physical card; only its hash is ever stored.
    cardId: z.string().min(1),
}).strict();
