import { z } from "zod";
import { emailAddress } from "../../../http/normalization";
import { claimsSchema, wireRoles } from "../../../http/principal";

export const loginBody = z
    .object({ email: emailAddress, password: z.string().min(1).max(200) })
    .strict();
export const refreshBody = z
    .object({ refreshToken: z.string().min(1).max(8192) })
    .strict();
export const logoutBody = z
    .object({ refreshToken: z.string().min(1).max(8192).optional() })
    .strict()
    .optional();
export const tokenClaims = claimsSchema.extend({
    sid: z.uuid().optional(),
    tokenUse: z.enum(["access", "refresh"]),
    iat: z.number().int(),
    exp: z.number().int(),
});
export const authUserSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: z.enum(wireRoles),
    schoolId: z.uuid().nullable(),
});
export const sessionResponseSchema = z.object({
    user: authUserSchema,
    session: z.object({
        tokenType: z.literal("Bearer"),
        accessToken: z.string().min(1),
        refreshToken: z.string().min(1),
        accessTokenExpiresIn: z.number().int().positive(),
        refreshTokenExpiresIn: z.number().int().positive(),
    }),
});
export const webResponseSchema = z.object({
    user: authUserSchema.omit({ schoolId: true }),
});
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSessionResult = {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
};
