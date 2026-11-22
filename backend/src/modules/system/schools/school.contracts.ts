import { z } from "zod";
import {
    businessCode,
    emailAddress,
    profileStatus,
} from "../../../http/normalization";

const timezone = z
    .string()
    .trim()
    .min(1)
    .refine((value) => {
        try {
            new Intl.DateTimeFormat("en", { timeZone: value });
            return true;
        } catch {
            return false;
        }
    }, "Invalid timezone");
export const schoolBody = z
    .object({
        code: businessCode,
        name: z.string().trim().min(1).max(200),
        address: z.string().trim().min(1).max(500),
        contactPhone: z.string().trim().max(40).nullable().optional(),
        contactEmail: emailAddress.nullable().optional(),
        timezone,
        status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    })
    .strict();
export const schoolPatch = schoolBody
    .partial()
    .extend({ status: profileStatus.optional() })
    .strict();
export type CreateSchool = z.infer<typeof schoolBody>;
export type UpdateSchool = z.infer<typeof schoolPatch>;
export const schoolViewSchema = schoolBody.extend({
    id: z.uuid(),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    deletedAt: z.iso.datetime().nullable(),
});

export const schoolContextSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    timezone: z.string(),
});
