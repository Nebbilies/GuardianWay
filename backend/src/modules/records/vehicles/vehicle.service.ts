import { transaction, type Database } from "../../../config/database";
import { NotFoundError, ValidationError } from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import type { ListQuery } from "../../../http/contracts/pagination";
import { recordAudit, type RequestMetadata } from "../../system/audit";
import { vehicleRepository } from "./vehicle.repository";
import { vehicleBody, vehiclePatch } from "./vehicle.contracts";
export async function requireVehicle(schoolId: string, id: string, database?: Database, lock = false) {
    if (database && lock) await vehicleRepository.lockForRead(database, schoolId, id);
    const row = await vehicleRepository.find(schoolId, id, database);
    if (!row || row.deletedAt || row.status !== "AVAILABLE") throw new ValidationError("Vehicle is unavailable or does not belong to this school");
    return row;
}
export const vehicleService = {
    list(actor: Principal, query: ListQuery, exportAll = false) { return vehicleRepository.list(requireSchoolAdmin(actor).schoolId, query, exportAll); },
    async get(actor: Principal, id: string) {
        const row = await vehicleRepository.find(requireSchoolAdmin(actor).schoolId, id);
        if (!row || row.deletedAt) throw new NotFoundError("Vehicle not found");
        return row;
    },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor), data = vehicleBody.parse(input);

        return transaction(async database => {
            const row = await vehicleRepository.create(database, { ...data, schoolId });
            await recordAudit(database, actor, { action: "vehicle.created", subjectKind: "VEHICLE", subjectReference: row.id, after: row }, metadata);
            return row;
        });
    },
    async change(actor: Principal, id: string, input: unknown, operation: "update" | "delete" | "restore", metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor), patch = operation === "update" ? vehiclePatch.parse(input) : {};
        return transaction(async database => {
            const before = await vehicleRepository.find(schoolId, id, database);
            if (!before || (operation === "restore" ? !before.deletedAt : before.deletedAt)) throw new NotFoundError("Vehicle not found");
            const data = { ...before, ...patch };

            const after = await vehicleRepository.update(database, schoolId, id, { ...patch, ...(operation === "delete" ? { deletedAt: new Date() } : operation === "restore" ? { deletedAt: null } : {}) });
            await recordAudit(database, actor, { action: "vehicle." + operation, subjectKind: "VEHICLE", subjectReference: id, before, after }, metadata);
            return after;
        });
    },
};
