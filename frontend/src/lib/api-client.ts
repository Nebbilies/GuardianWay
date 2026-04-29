export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_API_URL");
    }

    const url = `${apiBaseUrl}${path}`;
    const response = await fetch(url, {
        ...init,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(errorData.message || "Đã xảy ra lỗi", response.status);
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
