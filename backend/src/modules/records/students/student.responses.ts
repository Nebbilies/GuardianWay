import { z } from "zod";
import { instant, timestamps } from "../../../http/contracts/values";
import { profileStatus } from "../../../http/normalization";

export const studentSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    studentCode: z.string(),
    fullName: z.string(),
    classLabel: z.string().nullable(),
    status: profileStatus,
    ...timestamps,
});
export const guardianSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    studentId: z.uuid(),
    guardianAccountId: z.uuid(),
    guardian: z
        .object({ id: z.uuid(), displayName: z.string(), email: z.email() })
        .optional(),
    relationshipLabel: z.string().nullable(),
    canTrack: z.boolean(),
    canRequest: z.boolean(),
    confirmedById: z.uuid(),
    effectiveFrom: instant,
    effectiveTo: instant.nullable(),
    reason: z.string().nullable(),
});
export const cardSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    studentId: z.uuid(),
    cardUid: z.string(),
    technology: z.enum(["RFID", "NFC"]),
    assignedById: z.uuid(),
    revokedById: z.uuid().nullable(),
    effectiveFrom: instant,
    effectiveTo: instant.nullable(),
    reason: z.string().nullable(),
});
export const studentDetailSchema = studentSchema.extend({
    guardians: z.array(guardianSchema),
    cards: z.array(cardSchema),
});
