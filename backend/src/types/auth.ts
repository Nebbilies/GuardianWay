import { Role } from "@prisma/client";

export interface AuthTokenPayload {
    userId: string;
    role: Role;
    // null for SUPER_ADMIN (platform-level, not bound to a school).
    schoolId: string | null;
}

export interface AuthenticatedRequestUser {
    userId: string;
    role: Role;
    schoolId: string | null;
}
