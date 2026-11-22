import { z } from "zod";
import { instant, localDate, localTime } from "../../../http/contracts/values";

export const scheduleSchema = z.object({
    id: z.uuid(),
    schoolId: z.uuid(),
    scheduleKey: z.uuid(),
    versionNo: z.number().int().positive(),
    previousScheduleId: z.uuid().nullable(),
    routeId: z.uuid(),
    planVersionId: z.uuid(),
    routeLabel: z.string(),
    direction: z.enum(["PICKUP", "DROPOFF"]),
    effectiveFrom: localDate,
    effectiveTo: localDate.nullable(),
    weekdays: z.array(z.number().int().min(1).max(7)),
    plannedStartTime: localTime,
    defaultVehicleId: z.uuid().nullable(),
    defaultDriverId: z.uuid().nullable(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]),
    createdAt: instant,
    updatedAt: instant,
});
