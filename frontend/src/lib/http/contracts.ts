import { z } from "zod";
import { apiRequest, ApiError, buildQuery } from "@/lib/api-client";
export const instant = z.iso.datetime({ offset: true });
export const localDate = z.iso.date();
export const localTime = z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
export const timestamps = {
    createdAt: instant,
    updatedAt: instant,
    deletedAt: instant.nullable(),
};
export const roleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "DRIVER", "PARENT"]);
export const resourceStatus = z.enum(["AVAILABLE", "UNAVAILABLE"]);
export const profileStatus = z.enum(["ACTIVE", "INACTIVE"]);
export const metadataSchema = z.object({
    currentPage: z.number().int().positive(),
    isFirstPage: z.boolean(),
    isLastPage: z.boolean(),
    previousPage: z.number().int().positive().nullable(),
    nextPage: z.number().int().positive().nullable(),
    pageCount: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
});
export function pageSchema<T extends z.ZodType>(row: T) {
    return z.object({ data: z.array(row), metadata: metadataSchema });
}
export type PaginationMetadata = z.infer<typeof metadataSchema>;
export type PaginatedResponse<T> = { data: T[]; metadata: PaginationMetadata };
export type ListParams = {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    deleted?: "exclude" | "only" | "include";
    status?: string;
    role?: string;
};
export type ApiCall = {
    path: string;
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
};
export function parseInput<T extends z.ZodType>(
    schema: T,
    input: unknown,
): z.output<T> {
    const result = schema.safeParse(input);
    if (!result.success)
        throw new ApiError("VALIDATION_ERROR", 400, {
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
                code: issue.code,
            })),
        });
    return result.data;
}
export async function callApi<T extends z.ZodType>(
    request: ApiCall,
    schema: T,
): Promise<z.output<T>> {
    const raw = await apiRequest<unknown>(request.path, {
        method: request.method,
        ...(request.body !== undefined
            ? { body: JSON.stringify(request.body) }
            : {}),
    });
    const result = schema.safeParse(raw);
    if (!result.success) throw new ApiError("INVALID_RESPONSE", 502);
    return result.data;
}
export function listPath(path: string, query: ListParams = {}) {
    const encoded = buildQuery(query);
    return path + (encoded ? "?" + encoded : "");
}
