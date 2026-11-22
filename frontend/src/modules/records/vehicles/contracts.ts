import { z } from "zod";
import { timestamps, resourceStatus, pageSchema, parseInput, callApi, listPath, type ListParams, type ApiCall } from "@/lib/http/contracts";
export const vehicleSchema = z.object({ id: z.uuid(), schoolId: z.uuid(), code: z.string(), plateNumber: z.string(), studentCapacity: z.number().int().positive(), status: resourceStatus, description: z.string().nullable(), ...timestamps });
export const vehicleInput = z.object({ code: z.string().trim().min(1), plateNumber: z.string().trim().min(1), studentCapacity: z.number().int().min(1).max(200), status: resourceStatus, description: z.string().max(1000).nullable().optional() }).strict();
export type Vehicle = z.infer<typeof vehicleSchema>;
export function createVehicleRequest(input: unknown): ApiCall { return { path: "/buses", method: "POST", body: parseInput(vehicleInput, input) }; }
export function updateVehicleRequest(id: string, input: unknown): ApiCall { return { path: "/buses/" + id, method: "PATCH", body: parseInput(vehicleInput.partial(), input) }; }
export const vehicleApi = { list: (query: ListParams) => callApi({ path: listPath("/buses", query), method: "GET" }, pageSchema(vehicleSchema)), create: (input: unknown) => callApi(createVehicleRequest(input), vehicleSchema), update: (id: string, input: unknown) => callApi(updateVehicleRequest(id, input), vehicleSchema), remove: (id: string) => callApi({ path: "/buses/" + id, method: "DELETE" }, vehicleSchema), restore: (id: string) => callApi({ path: "/buses/" + id + "/restore", method: "POST" }, vehicleSchema) };
