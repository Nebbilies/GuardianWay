import { z } from "zod";
import { AuthenticationError, AuthorizationError } from "../errors/http-errors";

export const canonicalRoles = [
    "PLATFORM_ADMIN",
    "SCHOOL_ADMIN",
    "DRIVER",
    "PARENT",
] as const;
export type CanonicalRole = (typeof canonicalRoles)[number];
export const wireRoles = ["SUPER_ADMIN", "ADMIN", "DRIVER", "PARENT"] as const;
export type WireRole = (typeof wireRoles)[number];

export type PlatformPrincipal = {
    kind: "platform";
    accountId: string;
    schoolId: null;
    role: "PLATFORM_ADMIN";
};
export type SchoolPrincipal = {
    kind: "school";
    accountId: string;
    schoolId: string;
    role: "SCHOOL_ADMIN" | "DRIVER" | "PARENT";
};
export type Principal = PlatformPrincipal | SchoolPrincipal;

export const claimsSchema = z.object({
    userId: z.uuid(),
    role: z.enum(canonicalRoles),
    schoolId: z.uuid().nullable(),
    contractVersion: z.literal(2),
});

export function principalFromClaims(value: unknown): Principal {
    const parsed = claimsSchema.safeParse(value);
    if (!parsed.success) {
        throw new AuthenticationError("Invalid authentication session");
    }
    const { userId, role, schoolId } = parsed.data;
    if (role === "PLATFORM_ADMIN" && schoolId === null) {
        return { kind: "platform", accountId: userId, schoolId, role };
    }
    if (role !== "PLATFORM_ADMIN" && schoolId) {
        return { kind: "school", accountId: userId, schoolId, role };
    }
    throw new AuthenticationError("Invalid account scope");
}

export function requireSchoolAdmin(actor: Principal): SchoolPrincipal {
    if (actor.kind !== "school" || actor.role !== "SCHOOL_ADMIN") {
        throw new AuthorizationError("School administrator access required");
    }
    return actor;
}

export function requirePlatform(actor: Principal): PlatformPrincipal {
    if (actor.kind !== "platform") {
        throw new AuthorizationError("Platform administrator access required");
    }
    return actor;
}

export function toWireRole(role: string): WireRole {
    if (role === "PLATFORM_ADMIN") {
        return "SUPER_ADMIN";
    }
    if (role === "SCHOOL_ADMIN") {
        return "ADMIN";
    }
    if (role === "DRIVER" || role === "PARENT") {
        return role;
    }
    throw new AuthenticationError("Invalid account role");
}

export function fromWireRole(role: WireRole): CanonicalRole {
    if (role === "SUPER_ADMIN") {
        return "PLATFORM_ADMIN";
    }
    if (role === "ADMIN") {
        return "SCHOOL_ADMIN";
    }
    return role;
}
