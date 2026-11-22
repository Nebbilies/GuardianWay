import { invitationSchema, accountInput } from "@/modules/system/accounts/contracts";
import { z } from "zod";
import { timestamps, resourceStatus, pageSchema, parseInput, callApi, listPath, type ListParams, type ApiCall } from "@/lib/http/contracts";
export const driverSchema = z.object({ id: z.uuid(), schoolId: z.uuid(), code: z.string(), fullName: z.string(), phone: z.string(), status: resourceStatus, notes: z.string().nullable(), accountId: z.uuid().nullable(), ...timestamps });
export const driverInput = z.object({ code: z.string().trim().min(1), fullName: z.string().trim().min(1), phone: z.string().trim().min(1), status: resourceStatus, notes: z.string().nullable().optional(), accountId: z.uuid().nullable().optional() }).strict();
export type Driver = z.infer<typeof driverSchema>;
export function createDriverRequest(input: unknown): ApiCall { return { path: "/drivers", method: "POST", body: parseInput(driverInput, input) }; }
export function updateDriverRequest(id: string, input: unknown): ApiCall { return { path: "/drivers/" + id, method: "PATCH", body: parseInput(driverInput.partial(), input) }; }
export const driverApi = { list: (query: ListParams & { unlinked?: "true" | "false" }) => callApi({ path: listPath("/drivers", query), method: "GET" }, pageSchema(driverSchema)), create: (input: unknown) => callApi(createDriverRequest(input), driverSchema), update: (id: string, input: unknown) => callApi(updateDriverRequest(id, input), driverSchema), remove: (id: string) => callApi({ path: "/drivers/" + id, method: "DELETE" }, driverSchema), restore: (id: string) => callApi({ path: "/drivers/" + id + "/restore", method: "POST" }, driverSchema) };

export const driverInvitationSchema = invitationSchema.extend({ driver: z.object({ id: z.uuid(), accountId: z.uuid().nullable(), code: z.string(), fullName: z.string() }) });
export function onboardDriverRequest(input: unknown): ApiCall { return { path: "/drivers/onboarding", method: "POST", body: parseInput(z.object({ account: accountInput.omit({ role: true }), driverId: z.uuid().optional(), driver: z.object({ code: z.string().min(1), fullName: z.string().min(1), phone: z.string().min(1), status: z.enum(["AVAILABLE", "UNAVAILABLE"]), notes: z.string().nullable().optional() }).strict().optional() }).strict().refine(data => Boolean(data.driverId) !== Boolean(data.driver)), input) }; }
