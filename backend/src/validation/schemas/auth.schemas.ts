import {z} from "zod";

export const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const setupPasswordBodySchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
});

export const issueInviteBodySchema = z.object({
    email: z.string().email(),
});
