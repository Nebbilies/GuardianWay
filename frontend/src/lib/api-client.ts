export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
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
    const normalizedPath = path.split("?")[0]?.split("#")[0]?.replace(/\/+$/, "") || path;

    return (
        normalizedPath === "/auth/login" ||
        normalizedPath === "/auth/refresh" ||
        normalizedPath === "/auth/setup-password"
    );
}

async function parseErrorMessage(response: Response) {
    const errorData = await response
        .json()
        .catch(() => ({detail: response.statusText || "Đã xảy ra lỗi"}));

    return errorData.detail || errorData.message || "Đã xảy ra lỗi";
}

async function requestOnce(url: string, init: RequestInit = {}) {
    return fetch(url, {
        ...init,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    });
}

async function refreshToken() {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw new ApiError("Failed to refresh token", res.status);
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${getApiBaseUrl()}${path}`;

    let response = await requestOnce(url, init);

    if (response.status === 401 && !shouldSkipRefresh(path)) {
        await refreshToken();
        response = await requestOnce(url, init);
    }

    if (!response.ok) {
        const errorMessage = await parseErrorMessage(response);
        throw new ApiError(errorMessage, response.status);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, String(value));
        }
    });

    return searchParams.toString();
}
