import { z } from "zod";
export const cardBody = z
    .object({
        cardUid: z
            .string()
            .min(1)
            .max(256)
            .refine((value) => value.trim().length > 0, "Card UID is required"),
        technology: z.enum(["RFID", "NFC"]),
    })
    .strict();
