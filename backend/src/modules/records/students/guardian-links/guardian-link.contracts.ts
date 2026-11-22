import { z } from "zod";
export const guardianBody = z.object({ guardianAccountId: z.uuid(), relationshipLabel: z.string().trim().min(1).max(100).nullable().optional(), canTrack: z.boolean(), canRequest: z.boolean() }).strict();
