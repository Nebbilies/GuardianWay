import { NextRequest, NextResponse } from "next/server";

type AuthTokenPayload = {
    role: "PLATFORM_ADMIN" | "SCHOOL_ADMIN" | "DRIVER" | "PARENT";
};

const PLATFORM_HOME = "/platform/schools";
const ADMIN_HOME = "/admin/users";

function decodeJwtPayload(token: string): AuthTokenPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        // Routing hint only. The backend verifies JWT signatures and permissions.
        const payload: unknown = JSON.parse(atob(padded));
        if (
            !payload ||
            typeof payload !== "object" ||
            !("role" in payload) ||
            !("contractVersion" in payload) ||
            payload.contractVersion !== 2 ||
            !("tokenUse" in payload) ||
            payload.tokenUse !== "access" ||
            !("schoolId" in payload)
        )
            return null;
        const role = payload.role;
        if (role === "PLATFORM_ADMIN" && payload.schoolId === null)
            return { role };
        if (
            ["SCHOOL_ADMIN", "DRIVER", "PARENT"].includes(String(role)) &&
            typeof payload.schoolId === "string" &&
            payload.schoolId
        )
            return { role: role as AuthTokenPayload["role"] };
        return null;
    } catch {
        return null;
    }
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isAdmin = pathname.startsWith("/admin");
    const isPlatform = pathname.startsWith("/platform");
    if (!isAdmin && !isPlatform) return NextResponse.next();

    const accessToken = req.cookies.get("gw_access_token")?.value;
    if (!accessToken) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = decodeJwtPayload(accessToken)?.role;
    if (!role) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isPlatform && role !== "PLATFORM_ADMIN") {
        const dest = role === "SCHOOL_ADMIN" ? ADMIN_HOME : "/login";
        return NextResponse.redirect(new URL(dest, req.url));
    }

    if (isAdmin && role !== "SCHOOL_ADMIN") {
        const dest = role === "PLATFORM_ADMIN" ? PLATFORM_HOME : "/login";
        return NextResponse.redirect(new URL(dest, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/platform/:path*"],
};
