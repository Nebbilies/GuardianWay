import { Role } from "@prisma/client";

export interface AuthTokenPayload {
    userId: string;
    role: Role;
}

export interface AuthenticatedRequestUser {
    userId: string;
    role: Role;
}
