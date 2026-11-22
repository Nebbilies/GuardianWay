import { z } from "zod";
import { timestamps, instant, roleSchema, pageSchema, parseInput, callApi, listPath, type ListParams, type ApiCall } from "@/lib/http/contracts";
export const accountSchema = z.object({ id: z.uuid(), schoolId: z.uuid().nullable(), displayName: z.string(), email: z.email(), phone: z.string().nullable(), role: roleSchema, status: z.enum(["INVITED", "ACTIVE", "LOCKED"]), activatedAt: instant.nullable(), ...timestamps });
export const accountInput = z.object({ displayName: z.string().trim().min(1), email: z.email(), phone: z.string().nullable().optional(), role: roleSchema }).strict();
export const invitationSchema = z.object({ account: accountSchema, inviteLink: z.url(), expiresAt: instant, deliveryStatus: z.enum(["SENT", "FAILED", "NOT_CONFIGURED"]) });
export type Account = z.infer<typeof accountSchema>;
export type Invitation = z.infer<typeof invitationSchema>;
export function createAccountRequest(input: unknown, schoolId?: string): ApiCall { return { path: schoolId ? "/schools/" + schoolId + "/admins" : "/users", method: "POST", body: parseInput(accountInput, input) }; }
export function updateAccountRequest(id: string, input: unknown, schoolId?: string): ApiCall { return { path: (schoolId ? "/schools/" + schoolId + "/admins" : "/users") + "/" + id, method: "PATCH", body: parseInput(accountInput.partial().extend({ status: z.enum(["INVITED", "ACTIVE", "LOCKED"]).optional() }), input) }; }
export const accountApi = {
    list: (query: ListParams, schoolId?: string) => callApi({ path: listPath(schoolId ? "/schools/" + schoolId + "/admins" : "/users", query), method: "GET" }, pageSchema(accountSchema)),
    create: (input: unknown, schoolId?: string) => callApi(createAccountRequest(input, schoolId), invitationSchema), update: (id: string, input: unknown, schoolId?: string) => callApi(updateAccountRequest(id, input, schoolId), accountSchema),
    remove: (id: string, schoolId?: string) => callApi({ path: (schoolId ? "/schools/" + schoolId + "/admins" : "/users") + "/" + id, method: "DELETE" }, accountSchema),
    restore: (id: string, schoolId?: string) => callApi({ path: (schoolId ? "/schools/" + schoolId + "/admins" : "/users") + "/" + id + "/restore", method: "POST" }, accountSchema),
    invite: (id: string, schoolId?: string) => callApi({ path: (schoolId ? "/schools/" + schoolId + "/admins" : "/users") + "/" + id + "/invite", method: "POST" }, invitationSchema),
};
