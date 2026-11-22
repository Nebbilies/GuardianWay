import { z } from "zod";
import { businessCode, plateNumber, resourceStatus, profileStatus } from "../../../http/normalization";
export const stopBody = z.object({ code: businessCode, name: z.string().trim().min(1).max(200), address: z.string().trim().min(1).max(500), latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180), kind: z.enum(["SERVICE_POINT", "SCHOOL"]), allowsPickup: z.boolean(), allowsDropoff: z.boolean(), status: profileStatus.default("ACTIVE"), accessNote: z.string().trim().max(1000).nullable().optional() }).strict();
export const stopPatch = stopBody.partial().extend({ status: profileStatus.optional() }).strict();
export type StopInput = z.infer<typeof stopBody>;

import { listQuerySchema } from "../../../http/contracts/pagination";
export const stopQuery = listQuerySchema.extend({ status: profileStatus.optional(), kind: stopBody.shape.kind.optional() });
