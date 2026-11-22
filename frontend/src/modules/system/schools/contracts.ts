import { z } from "zod";
import {
    timestamps,
    profileStatus,
    pageSchema,
    parseInput,
    callApi,
    listPath,
    type ListParams,
    type ApiCall,
} from "@/lib/http/contracts";
export const schoolInput = z
    .object({
        code: z.string().trim().min(1),
        name: z.string().trim().min(1),
        address: z.string().trim().min(1),
        timezone: z.string().min(1),
        contactPhone: z.string().nullable().optional(),
        contactEmail: z.email().nullable().optional(),
        status: profileStatus,
    })
    .strict();
export const schoolSchema = z.object({
    ...schoolInput.shape,
    id: z.uuid(),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
    ...timestamps,
});
export type School = z.infer<typeof schoolSchema>;
export function createSchoolRequest(input: unknown): ApiCall {
    return {
        path: "/schools",
        method: "POST",
        body: parseInput(schoolInput, input),
    };
}
export function updateSchoolRequest(id: string, input: unknown): ApiCall {
    return {
        path: "/schools/" + id,
        method: "PATCH",
        body: parseInput(schoolInput.partial(), input),
    };
}
export const schoolApi = {
    list: (query: ListParams) =>
        callApi(
            { path: listPath("/schools", query), method: "GET" },
            pageSchema(schoolSchema),
        ),
    create: (input: unknown) =>
        callApi(createSchoolRequest(input), schoolSchema),
    update: (id: string, input: unknown) =>
        callApi(updateSchoolRequest(id, input), schoolSchema),
    remove: (id: string) =>
        callApi({ path: "/schools/" + id, method: "DELETE" }, schoolSchema),
    restore: (id: string) =>
        callApi(
            { path: "/schools/" + id + "/restore", method: "POST" },
            schoolSchema,
        ),
};

export const schoolContextSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    timezone: z.string(),
});
export const getSchoolContext = () =>
    callApi({ path: "/school-context", method: "GET" }, schoolContextSchema);
