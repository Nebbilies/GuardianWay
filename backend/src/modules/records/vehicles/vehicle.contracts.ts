import { z } from "zod";
import { businessCode, plateNumber, resourceStatus, profileStatus } from "../../../http/normalization";
export const vehicleBody = z.object({ code: businessCode, plateNumber, studentCapacity: z.number().int().min(1).max(200), status: resourceStatus.default("AVAILABLE"), description: z.string().trim().max(1000).nullable().optional() }).strict();
export const vehiclePatch = vehicleBody.partial().extend({ status: resourceStatus.optional() }).strict();
export type VehicleInput = z.infer<typeof vehicleBody>;

import { listQuerySchema } from "../../../http/contracts/pagination";
export const vehicleQuery = listQuerySchema.extend({ status: resourceStatus.optional() });
