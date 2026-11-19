import { transaction, type Database } from "../../../config/database";
import { requirePlatform, requireSchoolAdmin, type Principal } from "../../../http/principal";
import { ConflictError, NotFoundError } from "../../../errors/http-errors";
import type { ListQuery } from "../../../http/contracts/pagination";
import { recordAudit, type RequestMetadata } from "../audit";
import { schoolRepository } from "./school.repository";
import { schoolBody, schoolPatch } from "./school.contracts";

export async function readSchool(id: string, database?: Database, lockTimezone = false) {
    if (database && lockTimezone) await schoolRepository.lock(database, id, false);
    return schoolRepository.find(id, database);
}

export const schoolService = {
    async context(actor: Principal) {
        const row = await schoolRepository.find(requireSchoolAdmin(actor).schoolId);
        if (!row) throw new NotFoundError("School not found");
        return { id: row.id, code: row.code, name: row.name, timezone: row.timezone };
    },
    list(actor: Principal, query: ListQuery) { requirePlatform(actor); return schoolRepository.list(query); },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata) {
        requirePlatform(actor);
        const data = schoolBody.parse(input);
        return transaction(async database => {
            const school = await schoolRepository.create(database, data);
            await recordAudit(database, actor, { action: "school.created", subjectKind: "SCHOOL", subjectReference: school.id, schoolId: school.id, after: school }, metadata);
            return school;
        });
    },
    async change(actor: Principal, id: string, input: unknown, operation: "update" | "delete" | "restore", metadata: RequestMetadata) {
        requirePlatform(actor);
        const patch = operation === "update" ? schoolPatch.parse(input) : {};
        return transaction(async database => {
            await schoolRepository.lock(database, id, true);
            const before = await schoolRepository.find(id, database);
            if (!before || (operation === "restore" ? !before.deletedAt : before.deletedAt)) throw new NotFoundError("School not found");
            if ((operation === "delete" || patch.status === "INACTIVE") && await schoolRepository.runningTrips(database, id)) {
                throw new ConflictError("Resolve running trips before deactivating the school", "SCHOOL_HAS_OPEN_TRIPS");
            }
            if (patch.timezone && before.timezone !== patch.timezone && await schoolRepository.preparedTrips(database, id)) {
                throw new ConflictError("Resolve prepared trips before changing the school timezone");
            }
            const after = await schoolRepository.update(database, id, {
                ...patch, ...(operation === "delete" ? { deletedAt: new Date() } : operation === "restore" ? { deletedAt: null } : {}),
            });
            await recordAudit(database, actor, { action: "school." + operation, subjectKind: "SCHOOL", subjectReference: id, schoolId: id, before, after }, metadata);
            return after;
        });
    },
};
