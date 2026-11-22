import { z } from "zod";
import { errorMessage } from "./i18n";

const problemSchema = z.object({
    code: z.string().min(1).max(100).optional(),
    traceId: z.string().optional(),
    errors: z
        .array(
            z.object({
                field: z.string(),
                message: z.string(),
                code: z.string().optional(),
            }),
        )
        .optional(),
});
export class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    readonly traceId?: string;
    readonly errors?: z.infer<typeof problemSchema>["errors"];

    constructor(
        code: string,
        status: number,
        context: z.infer<typeof problemSchema> = {},
    ) {
        super(errorMessage(code));
        this.name = "ApiError";
        this.code = code;
        this.status = status;
        this.traceId = context.traceId;
        this.errors = context.errors;
    }
}

// this prevents multiple simultaneous refresh attempts and infinite loops
let refreshPromise: Promise<void> | null = null;

function getApiBaseUrl() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_API_URL");
    }

    return apiBaseUrl;
}

function shouldSkipRefresh(path: string) {
    const normalizedPath =
        path.split("?")[0]?.split("#")[0]?.replace(/\/+$/, "") || path;

    return (
        normalizedPath === "/auth/login" ||
        normalizedPath === "/auth/refresh" ||
        normalizedPath === "/auth/logout" ||
        normalizedPath === "/auth/setup-password"
    );
}

async function responseError(response: Response) {
    const parsed = problemSchema.safeParse(
        await response.json().catch(() => null),
    );
    const problem = parsed.success ? parsed.data : {};
    return new ApiError(
        problem.code ?? "UNKNOWN_ERROR",
        response.status,
        problem,
    );
}

let sessionQueue: Promise<unknown> = Promise.resolve();

async function requestOnce(url: string, init: RequestInit = {}) {
    const send = () =>
        fetch(url, {
            ...init,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(init.headers || {}),
            },
        });
    try {
        if (/\/auth\/(login|refresh|logout)$/.test(url)) {
            if (typeof navigator !== "undefined" && navigator.locks) {
                return await navigator.locks.request(
                    "guardianway-web-session",
                    send,
                );
            }
            const pending = sessionQueue.then(send, send);
            sessionQueue = pending.catch(() => undefined);
            return await pending;
        }
        return await send();
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError")
            throw new ApiError("REQUEST_ABORTED", 0);
        throw new ApiError("NETWORK_ERROR", 0);
    }
}

async function refreshToken() {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const res = await requestOnce(`${getApiBaseUrl()}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw await responseError(res);
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export function apiRequest(
    path: string,
    init: RequestInit,
    responseMode: "status",
): Promise<void>;
export function apiRequest<T>(path: string, init?: RequestInit): Promise<T>;
export async function apiRequest<T>(
    path: string,
    init: RequestInit = {},
    responseMode?: "status",
): Promise<T | void> {
    const url = `${getApiBaseUrl()}${path}`;

    let response = await requestOnce(url, init);

    if (response.status === 401 && !shouldSkipRefresh(path)) {
        await refreshToken();
        response = await requestOnce(url, init);
    }

    if (!response.ok) {
        throw await responseError(response);
    }

    if (response.status === 204 || responseMode === "status") return;

    try {
        return await response.json();
    } catch {
        throw new ApiError("INVALID_RESPONSE", response.status);
    }
}

export function buildQuery(
    params: Record<string, string | number | undefined | null>,
) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, String(value));
        }
    });

    return searchParams.toString();
}
