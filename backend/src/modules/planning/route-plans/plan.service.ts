import { isDeepStrictEqual } from "node:util";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { transaction, type Database } from "../../../config/database";
import { ConflictError, NotFoundError, ValidationError } from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import { dateValue, dateText, timeValue, timeText, schoolInstant } from "../../../utils/school-time";
import { readSchool } from "../../system/schools";
import { requirePolicy } from "../../system/school-policies";
import { requireVehiclesForPlan } from "../../records/vehicles";
import { requireActiveStops } from "../stops";
import { recordAudit, type RequestMetadata } from "../../system/audit";
import { planRepository } from "./plan.repository";
import { planBody, type PlanInput, type planQuery } from "./plan.contracts";
import type { z } from "zod";

type Plan = NonNullable<Awaited<ReturnType<typeof planRepository.find>>>;
function view(plan: Plan) { return { ...plan, referenceDate: dateText(plan.referenceDate), effectiveFrom: plan.effectiveFrom ? dateText(plan.effectiveFrom) : null, effectiveTo: plan.effectiveTo ? dateText(plan.effectiveTo) : null,
    pickupArrivalDeadline: plan.pickupArrivalDeadline ? timeText(plan.pickupArrivalDeadline) : null, dropoffDepartureTime: plan.dropoffDepartureTime ? timeText(plan.dropoffDepartureTime) : null,
    source: "MANUAL", passengerPlanningComplete: false, routes: plan.routes.map(route => ({ ...route, stops: route.stops.map(stop => ({ ...stop, plannedTime: timeText(stop.plannedTime) })) })),
}; }
async function draftData(database: Database, schoolId: string, input: PlanInput, lockResources = false) {
    const policy = await requirePolicy(schoolId, input.policyVersionId, database), school = await readSchool(schoolId, database);
    if (!school) throw new NotFoundError("School not found");
    if (input.referenceDate < input.effectiveFrom || (input.effectiveTo && input.referenceDate > input.effectiveTo)) throw new ValidationError("Reference date must fall within the plan validity interval");
    const boundary = input.direction === "PICKUP" ? policy.pickupArrivalTime : policy.dropoffDepartureTime;
    if (!boundary) throw new ValidationError("Configure the school arrival/departure time before creating this plan");
    if (new Set(input.routes.map(row => row.routeCode)).size !== input.routes.length || new Set(input.routes.map(row => row.vehicleId)).size !== input.routes.length) throw new ValidationError("Route codes and vehicles must be distinct within the plan");
    const vehicles = await requireVehiclesForPlan(database, schoolId, input.routes.map(route => route.vehicleId), lockResources);
    const activeStops = await requireActiveStops(database, schoolId, input.routes.flatMap(route => route.stops.map(stop => stop.stopId)), lockResources);
    const routes = [];
    for (const route of input.routes) {
        const vehicle = vehicles.get(route.vehicleId)!, stops = [];
        let previous = -1;
        for (const [index, point] of route.stops.entries()) {
            const stop = activeStops.get(point.stopId)!, plannedTime = timeValue(point.plannedTime);
            schoolInstant(input.referenceDate, point.plannedTime, school.timezone);
            if (plannedTime.getTime() <= previous) throw new ValidationError("Stop times must increase within the same service day");
            previous = plannedTime.getTime();
            if (input.direction === "PICKUP" ? !stop.allowsPickup : !stop.allowsDropoff) throw new ValidationError("Stop does not support this direction");
            stops.push({ stopId: stop.id, sequenceNo: index + 1, plannedTime, stopSnapshot: { schemaVersion: 1, code: stop.code, name: stop.name, address: stop.address, latitude: stop.latitude, longitude: stop.longitude, kind: stop.kind, accessNote: stop.accessNote } });
        }
        const first = stops[0]!, last = stops[stops.length - 1]!;
        // A plan has stop times but no schedule start yet. Use its first known
        // operating instant; trip preparation validates the actual scheduled start.
        const firstPlannedAt = schoolInstant(input.referenceDate, timeText(first.plannedTime), school.timezone);
        if (firstPlannedAt < policy.effectiveFrom || (policy.effectiveTo && firstPlannedAt >= policy.effectiveTo)) throw new ValidationError("Policy does not apply at the first planned stop");
        if ((last.plannedTime.getTime() - first.plannedTime.getTime()) / 1000 > route.durationSeconds) throw new ValidationError("Route duration is shorter than the planned stop interval");
        const terminal = input.direction === "PICKUP" ? last : first;
        if (terminal.stopSnapshot.kind !== "SCHOOL") throw new ValidationError("Pickup routes must end at school; dropoff routes must start at school");
        if (input.direction === "PICKUP" ? terminal.plannedTime > boundary : terminal.plannedTime < boundary) throw new ValidationError("School arrival/departure time is not satisfied");
        routes.push({ routeCode: route.routeCode, label: route.label, vehicleId: vehicle.id, capacitySnapshot: vehicle.studentCapacity, distanceMetres: route.distanceMetres, durationSeconds: route.durationSeconds, stops });
    }
    return { policy, routes };
}
async function writeRoutes(database: Database, schoolId: string, planVersionId: string, routes: Awaited<ReturnType<typeof draftData>>["routes"]) {
    const saved = await planRepository.createRoutes(database, routes.map(({ stops: _stops, ...route }) => ({ ...route, schoolId, planVersionId })));
    const routeIds = new Map(saved.map(route => [route.routeCode, route.id]));
    await planRepository.createStops(database, routes.flatMap(route => {
        const routeId = routeIds.get(route.routeCode)!;
        return route.stops.map(stop => ({ ...stop, schoolId, routeId }));
    }));
}
function header(input: PlanInput, policy: Awaited<ReturnType<typeof requirePolicy>>) {
    return { referenceDate: dateValue(input.referenceDate), direction: input.direction, policyVersionId: policy.id,
        effectiveFrom: dateValue(input.effectiveFrom), effectiveTo: input.effectiveTo ? dateValue(input.effectiveTo) : null,
        pickupArrivalDeadline: policy.pickupArrivalTime, dropoffDepartureTime: policy.dropoffDepartureTime,
        inputSnapshot: JSON.parse(JSON.stringify({ schemaVersion: 1, source: "MANUAL", input })) as Prisma.InputJsonValue };
}
export async function requireApprovedRoute(schoolId: string, id: string, database?: Database) {
    const route = await planRepository.route(schoolId, id, database);
    const plan = route ? await planRepository.find(schoolId, route.planVersionId, database) : null;
    if (!route || !plan || plan.status !== "APPROVED") throw new ConflictError("Route must belong to an approved plan", "PLAN_NOT_APPROVED");
    return { route, plan, stops: plan.routes.find(row => row.id === id)!.stops };
}
export const planService = {
    async list(actor: Principal, query: z.infer<typeof planQuery>) { const page = await planRepository.list(requireSchoolAdmin(actor).schoolId, query); return { ...page, data: page.data.filter((row): row is Plan => Boolean(row)).map(view) }; },
    async get(actor: Principal, id: string) { const row = await transaction(database => planRepository.find(requireSchoolAdmin(actor).schoolId, id, database), "RepeatableRead"); if (!row) throw new NotFoundError("Plan not found"); return view(row); },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata, previousId?: string) {
        const { schoolId } = requireSchoolAdmin(actor), data = planBody.parse(input);
        return transaction(async database => {
            const previous = previousId ? await planRepository.find(schoolId, previousId, database) : null;
            if (previousId && (!previous || previous.status !== "APPROVED")) throw new ConflictError("Create a revision from an approved plan");
            if (previous) {
                await planRepository.lock(database, schoolId, previous.id);
                const latest = await planRepository.latest(database, schoolId, previous.planKey);
                if (latest?.id !== previous.id || previous.direction !== data.direction) throw new ConflictError("Revise the latest approved version without changing its direction");
            }
            const draft = await draftData(database, schoolId, data);
            const row = await planRepository.create(database, { ...header(data, draft.policy), schoolId, planKey: previous?.planKey ?? randomUUID(), versionNo: (previous?.versionNo ?? 0) + 1, previousVersionId: previous?.id, status: "DRAFT", createdById: actor.accountId });
            await writeRoutes(database, schoolId, row.id, draft.routes);
            const after = (await planRepository.find(schoolId, row.id, database))!;
            await recordAudit(database, actor, { action: "plan.created", subjectKind: "PLAN_VERSION", subjectReference: row.id, after }, metadata);
            return view(after);
        });
    },
    async update(actor: Principal, id: string, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor), data = planBody.parse(input);
        return transaction(async database => {
            await planRepository.lock(database, schoolId, id);
            const before = await planRepository.find(schoolId, id, database);
            if (!before) throw new NotFoundError("Plan not found");
            if (before.status !== "DRAFT") throw new ConflictError("Approved plans must be changed through a new version");
            if (before.direction !== data.direction) throw new ValidationError("A plan version cannot change direction");
            const draft = await draftData(database, schoolId, data);
            await planRepository.clearRoutes(database, schoolId, id);
            await planRepository.update(database, schoolId, id, header(data, draft.policy));
            await writeRoutes(database, schoolId, id, draft.routes);
            const after = (await planRepository.find(schoolId, id, database))!;
            await recordAudit(database, actor, { action: "plan.updated", subjectKind: "PLAN_VERSION", subjectReference: id, before, after }, metadata);
            return view(after);
        });
    },
    async approve(actor: Principal, id: string, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor);
        return transaction(async database => {
            await planRepository.lock(database, schoolId, id);
            const before = await planRepository.find(schoolId, id, database);
            if (!before) throw new NotFoundError("Plan not found");
            if (before.status !== "DRAFT") throw new ConflictError("Only draft plans can be approved");
            const snapshot = before.inputSnapshot as { input?: unknown };
            const current = await draftData(database, schoolId, planBody.parse(snapshot.input), true);
            const routes = new Map(current.routes.map(route => [route.routeCode, route]));
            for (const route of before.routes) {
                const refreshed = routes.get(route.routeCode);
                if (!refreshed || refreshed.vehicleId !== route.vehicleId || refreshed.capacitySnapshot !== route.capacitySnapshot) {
                    throw new ConflictError("Vehicle capacity changed; save the draft again before approval");
                }
                if (route.stops.length !== refreshed.stops.length || route.stops.some((point, i) => {
                    const stop = refreshed.stops[i];
                    return !stop || point.stopId !== stop.stopId || !isDeepStrictEqual(point.stopSnapshot, stop.stopSnapshot);
                })) {
                    throw new ConflictError("Stop changed; save the draft again before approval");
                }
            }
            await planRepository.update(database, schoolId, id, { status: "APPROVED", approvedAt: new Date(), approvedById: actor.accountId });
            const after = (await planRepository.find(schoolId, id, database))!;
            await recordAudit(database, actor, { action: "plan.approved", subjectKind: "PLAN_VERSION", subjectReference: id, before, after }, metadata);
            return view(after);
        });
    },
};
