import { z } from "zod";
import { ValidationError } from "../../errors/http-errors";

export const listQuerySchema = z.object({
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.string().max(64).optional(),
    deleted: z.enum(["exclude", "only", "include"]).default("exclude"),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export interface PaginatedResponse<T> {
    data: T[];
    metadata: {
        currentPage: number; isFirstPage: boolean; isLastPage: boolean;
        previousPage: number | null; nextPage: number | null; pageCount: number; totalCount: number;
    };
}

export function pageResult<T>(data: T[], totalCount: number, query: Pick<ListQuery, "page" | "limit">): PaginatedResponse<T> {
    const pageCount = Math.ceil(totalCount / query.limit);
    return { data, metadata: {
        currentPage: query.page, pageCount, totalCount,
        isFirstPage: query.page === 1, isLastPage: query.page >= pageCount,
        previousPage: query.page > 1 ? query.page - 1 : null,
        nextPage: query.page < pageCount ? query.page + 1 : null,
    } };
}

export function listOptions(query: ListQuery, fields: readonly string[], fallback: string) {
    const sort = query.sort ?? fallback;
    const field = sort.startsWith("-") ? sort.slice(1) : sort;
    if (!fields.includes(field)) throw new ValidationError("Invalid sort field");
    return {
        skip: (query.page - 1) * query.limit, take: query.limit,
        orderBy: { [field]: sort.startsWith("-") ? "desc" as const : "asc" as const },
    };
}

export function deletedFilter(query: Pick<ListQuery, "deleted">) {
    return query.deleted === "only" ? { not: null } : query.deleted === "include" ? undefined : null;
}

export function pageResponseSchema<T extends z.ZodType>(row: T) {
    return z.object({ data: z.array(row), metadata: z.object({ currentPage: z.number().int().positive(), isFirstPage: z.boolean(), isLastPage: z.boolean(), previousPage: z.number().int().positive().nullable(), nextPage: z.number().int().positive().nullable(), pageCount: z.number().int().nonnegative(), totalCount: z.number().int().nonnegative() }) });
}
