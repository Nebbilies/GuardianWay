import { randomUUID } from "node:crypto";
import { z } from "zod";
import { transaction, type Database } from "../../../config/database";
import { ConflictError, NotFoundError, ValidationError } from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import { dateValue, dateText, timeValue, timeText, schoolInstant } from "../../../utils/school-time";
import { readSchool } from "../../system/schools";
import { requireApprovedRoute } from "../route-plans";
import { requireVehicle } from "../../records/vehicles";
import { requireDriver } from "../../records/drivers";
import { recordAudit, type RequestMetadata } from "../../system/audit";
import { scheduleRepository } from "./schedule.repository";
import { scheduleBody, scheduleQuery } from "./schedule.contracts";
type Schedule = NonNullable<Awaited<ReturnType<typeof scheduleRepository.find>>>;
function view(row: Schedule) { return { ...row, effectiveFrom: dateText(row.effectiveFrom), effectiveTo: row.effectiveTo ? dateText(row.effectiveTo) : null, plannedStartTime: timeText(row.plannedStartTime) }; }
async function validateData(database: Database, schoolId: string, input: z.infer<typeof scheduleBody>) {
    const { route, plan, stops } = await requireApprovedRoute(schoolId, input.routeId, database);
    if (!plan.effectiveFrom || input.effectiveFrom < dateText(plan.effectiveFrom) || (plan.effectiveTo && (!input.effectiveTo || input.effectiveTo > dateText(plan.effectiveTo)))) throw new ValidationError("Schedule validity must fit within the approved plan validity");
    const start = timeValue(input.plannedStartTime);
    if (!stops.length || start > stops[0]!.plannedTime) throw new ValidationError("Schedule must start before the first stop on the same service day");
    const school = await readSchool(schoolId, database);
    if (!school) throw new NotFoundError("School not found");
    schoolInstant(input.effectiveFrom, input.plannedStartTime, school.timezone);
    if (input.defaultVehicleId) await requireVehicle(schoolId, input.defaultVehicleId, database);
    if (input.defaultDriverId) await requireDriver(schoolId, input.defaultDriverId, database);
    return { route, plan, direction: plan.direction };
}
export async function requireActiveSchedule(schoolId: string, id: string, serviceDate: string, database?: Database) {
    const row = await scheduleRepository.find(schoolId, id, database), day = dateValue(serviceDate);
    if (!row || row.status !== "ACTIVE" || day < row.effectiveFrom || (row.effectiveTo && day > row.effectiveTo) || !row.weekdays.includes(day.getUTCDay() || 7)) throw new ConflictError("Schedule does not apply to this service date", "SCHEDULE_NOT_APPLICABLE");
    return row;
}
export const scheduleService = {
    async list(actor: Principal, query: z.infer<typeof scheduleQuery>) { const page = await scheduleRepository.list(requireSchoolAdmin(actor).schoolId, query); return { ...page, data: page.data.filter((row): row is Schedule => Boolean(row)).map(view) }; },
    async get(actor: Principal, id: string) { const row = await transaction(database => scheduleRepository.find(requireSchoolAdmin(actor).schoolId, id, database), "RepeatableRead"); if (!row) throw new NotFoundError("Schedule not found"); return view(row); },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata, previousId?: string) {
        const { schoolId } = requireSchoolAdmin(actor), data = scheduleBody.parse(input);
        return transaction(async database => {
            if (previousId) await scheduleRepository.lock(database, schoolId, previousId);
            const previous = previousId ? await scheduleRepository.find(schoolId, previousId, database) : null;
            if (previousId && !previous) throw new NotFoundError("Previous schedule not found");
            if (previous) {
                const latest = await scheduleRepository.latest(database, schoolId, previous.scheduleKey);
                if (latest?.id !== previous.id) throw new ConflictError("Revise the latest schedule version");
            }
            const source = await validateData(database, schoolId, data);
            if (previous && previous.direction !== source.direction) throw new ValidationError("A schedule version cannot change direction");
            const { weekdays, ...fields } = data;
            const row = await scheduleRepository.create(database, { ...fields, schoolId, scheduleKey: previous?.scheduleKey ?? randomUUID(), versionNo: (previous?.versionNo ?? 0) + 1, previousScheduleId: previous?.id, direction: source.direction, effectiveFrom: dateValue(data.effectiveFrom), effectiveTo: data.effectiveTo ? dateValue(data.effectiveTo) : null, plannedStartTime: timeValue(data.plannedStartTime), status: "DRAFT", createdById: actor.accountId });
            await scheduleRepository.weekdays(database, schoolId, row.id, weekdays);
            const after = (await scheduleRepository.find(schoolId, row.id, database))!;
            await recordAudit(database, actor, { action: "schedule.created", subjectKind: "RECURRING_SCHEDULE", subjectReference: row.id, after }, metadata);
            return view(after);
        });
    },
    async update(actor: Principal, id: string, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor), data = scheduleBody.parse(input);
        return transaction(async database => {
            await scheduleRepository.lock(database, schoolId, id);
            const before = await scheduleRepository.find(schoolId, id, database);
            if (!before) throw new NotFoundError("Schedule not found");
            if (before.status !== "DRAFT") throw new ConflictError("Create a new version to change a published schedule");
            const source = await validateData(database, schoolId, data);
            if (source.direction !== before.direction) throw new ValidationError("A schedule version cannot change direction");
            const { weekdays, ...fields } = data;
            await scheduleRepository.update(database, schoolId, id, { ...fields, effectiveFrom: dateValue(data.effectiveFrom), effectiveTo: data.effectiveTo ? dateValue(data.effectiveTo) : null, plannedStartTime: timeValue(data.plannedStartTime) });
            await scheduleRepository.weekdays(database, schoolId, id, weekdays);
            const after = (await scheduleRepository.find(schoolId, id, database))!;
            await recordAudit(database, actor, { action: "schedule.updated", subjectKind: "RECURRING_SCHEDULE", subjectReference: id, before, after }, metadata);
            return view(after);
        });
    },
    async transition(actor: Principal, id: string, operation: "activate" | "deactivate", metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor);
        return transaction(async database => {
            await scheduleRepository.lock(database, schoolId, id);
            const before = await scheduleRepository.find(schoolId, id, database);
            if (!before) throw new NotFoundError("Schedule not found");
            if (operation === "activate") {
                if (before.status === "ACTIVE") throw new ConflictError("Schedule is already active");
                await validateData(database, schoolId, scheduleBody.parse({ routeId: before.routeId, effectiveFrom: dateText(before.effectiveFrom), effectiveTo: before.effectiveTo ? dateText(before.effectiveTo) : null, weekdays: before.weekdays, plannedStartTime: timeText(before.plannedStartTime), defaultVehicleId: before.defaultVehicleId, defaultDriverId: before.defaultDriverId }));
            } else if (before.status !== "ACTIVE") throw new ConflictError("Only active schedules can be deactivated");
            await scheduleRepository.update(database, schoolId, id, { status: operation === "activate" ? "ACTIVE" : "INACTIVE" });
            const after = (await scheduleRepository.find(schoolId, id, database))!;
            await recordAudit(database, actor, { action: "schedule." + operation, subjectKind: "RECURRING_SCHEDULE", subjectReference: id, before, after }, metadata);
            return view(after);
        });
    },
};
