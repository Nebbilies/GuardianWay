import { z } from "zod";
export const instant = z.iso.datetime({ offset: true });
export const localDate = z.iso.date();
export const localTime = z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
export const timestamps = {
    createdAt: instant,
    updatedAt: instant,
    deletedAt: instant.nullable(),
};
