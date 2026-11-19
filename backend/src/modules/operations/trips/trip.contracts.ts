import { z } from "zod";
import { listQuerySchema } from "../../../http/contracts/pagination";
import { direction } from "../../../http/normalization";
import { localDateSchema, localTimeSchema } from "../../../utils/school-time";
export const tripBody = z.object({ scheduleId: z.uuid(), serviceDate: localDateSchema, vehicleId: z.uuid().optional(), driverId: z.uuid().optional() }).strict();
export const tripPatch = z.object({ expectedDataVersion: z.number().int().positive(), plannedStartTime: localTimeSchema.optional(), vehicleId: z.uuid().optional(), driverId: z.uuid().optional() }).strict().refine(data => data.plannedStartTime || data.vehicleId || data.driverId, "Provide a preparation change");
export const cancelBody = z.object({ expectedDataVersion: z.number().int().positive(), reason: z.string().trim().min(1).max(1000) }).strict();
export const tripQuery = listQuerySchema.extend({ status: z.enum(["PLANNED", "OPEN", "COMPLETED", "CANCELLED"]).optional(), direction: direction.optional(), serviceDate: localDateSchema.optional() });
