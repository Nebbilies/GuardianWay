import { z } from "zod";

export const businessCode = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((value) => value.toUpperCase());
export const emailAddress = z.string().trim().toLowerCase().pipe(z.email());
export const normalizePlate = (value: string) =>
    value.toUpperCase().replace(/[\s.-]/g, "");
export const plateNumber = z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform(normalizePlate)
    .pipe(z.string().min(1));
export const idParams = z.object({ id: z.uuid() });
export const reasonBody = z
    .object({ reason: z.string().trim().min(1).max(1000) })
    .strict();
export const resourceStatus = z.enum(["AVAILABLE", "UNAVAILABLE"]);
export const profileStatus = z.enum(["ACTIVE", "INACTIVE"]);
export const direction = z.enum(["PICKUP", "DROPOFF"]);
