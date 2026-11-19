import { z } from "zod";
import { emailAddress } from "../../../http/normalization";
import { wireRoles } from "../../../http/principal";
import { listQuerySchema } from "../../../http/contracts/pagination";

export const accountBody = z.object({
    displayName: z.string().trim().min(1).max(200), email: emailAddress,
    phone: z.string().trim().max(40).nullable().optional(), role: z.enum(wireRoles),
    schoolId: z.uuid().optional(),
}).strict();
export const accountPatch = accountBody.omit({ schoolId: true }).partial().extend({
    status: z.enum(["INVITED", "ACTIVE", "LOCKED"]).optional(),
}).strict();
export const accountQuery = listQuerySchema.extend({ role: z.enum(wireRoles).optional(), schoolId: z.uuid().optional() });
export type CreateAccount = z.infer<typeof accountBody>;
export type UpdateAccount = z.infer<typeof accountPatch>;
export const invitationBody = z.object({ email: emailAddress }).strict();
export const activationBody = z.object({ token: z.string().min(1), password: z.string().min(8).refine(value => Buffer.byteLength(value, "utf8") <= 72, "Password exceeds bcrypt byte limit") }).strict();
export const accountViewSchema = z.object({
    id: z.uuid(), schoolId: z.uuid().nullable(), email: z.email(), displayName: z.string(), phone: z.string().nullable(),
    role: z.enum(wireRoles), status: z.enum(["INVITED", "ACTIVE", "LOCKED"]), activatedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), deletedAt: z.iso.datetime().nullable(),
});
export const invitationResponseSchema = z.object({
    account: accountViewSchema, inviteLink: z.url(), expiresAt: z.iso.datetime(),
    deliveryStatus: z.enum(["SENT", "FAILED", "NOT_CONFIGURED"]),
});
