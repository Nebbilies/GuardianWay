import { z } from "zod";
import { instant, localDate, localTime, timestamps } from "../../../http/contracts/values";
import { resourceStatus, profileStatus } from "../../../http/normalization";

export const vehicleSchema = z.object({ id: z.uuid(), schoolId: z.uuid(), code: z.string(), plateNumber: z.string(), studentCapacity: z.number().int().positive(), status: resourceStatus, description: z.string().nullable(), ...timestamps });
