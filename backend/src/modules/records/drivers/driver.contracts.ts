import { z } from "zod";
import { businessCode, emailAddress, resourceStatus } from "../../../http/normalization";
const profileFields = { code: businessCode, fullName: z.string().trim().min(1).max(200), phone: z.string().trim().min(1).max(40), status: resourceStatus.default("AVAILABLE"), notes: z.string().trim().max(1000).nullable().optional() };
export const driverBody = z.object({ ...profileFields, accountId: z.uuid().nullable().optional() }).strict();
export const driverPatch = driverBody.partial().extend({ status: resourceStatus.optional() }).strict();
export const driverOnboarding = z.object({
    account: z.object({ displayName: z.string().trim().min(1).max(200), email: emailAddress, phone: z.string().trim().max(40).nullable().optional() }).strict(),
    driver: z.object(profileFields).strict().optional(), driverId: z.uuid().optional(),
}).strict().refine(data => Boolean(data.driver) !== Boolean(data.driverId), "Provide either a new driver profile or an existing driver ID");

import { listQuerySchema } from "../../../http/contracts/pagination";
export const driverQuery = listQuerySchema.extend({ status: resourceStatus.optional(), unlinked: z.enum(["true", "false"]).optional() });
