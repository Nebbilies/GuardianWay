import { transaction, type Database } from "../../../config/database";
import { NotFoundError, ValidationError } from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import type { ListQuery } from "../../../http/contracts/pagination";
import { recordAudit, type RequestMetadata } from "../../system/audit";
import { stopRepository } from "./stop.repository";
import { stopBody, stopPatch } from "./stop.contracts";
export async function requireActiveStops(
    database: Database,
    schoolId: string,
    ids: string[],
    lock: boolean,
) {
    const uniqueIds = [...new Set(ids)];
    const rows = await stopRepository.findForPlan(
        database,
        schoolId,
        uniqueIds,
        lock,
    );
    if (rows.length !== uniqueIds.length) {
        throw new ValidationError(
            "Stop is unavailable or does not belong to this school",
        );
    }
    return new Map(rows.map((row) => [row.id, row]));
}
export const stopService = {
    list(actor: Principal, query: ListQuery, exportAll = false) {
        return stopRepository.list(
            requireSchoolAdmin(actor).schoolId,
            query,
            exportAll,
        );
    },
    async get(actor: Principal, id: string) {
        const row = await stopRepository.find(
            requireSchoolAdmin(actor).schoolId,
            id,
        );
        if (!row || row.deletedAt) {
            throw new NotFoundError("Stop not found");
        }
        return row;
    },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = stopBody.parse(input);
        if (!data.allowsPickup && !data.allowsDropoff) {
            throw new ValidationError("A stop must support pickup or dropoff");
        }
        return transaction(async (database) => {
            const row = await stopRepository.create(database, {
                ...data,
                schoolId,
            });
            await recordAudit(
                database,
                actor,
                {
                    action: "stop.created",
                    subjectKind: "STOP",
                    subjectReference: row.id,
                    after: row,
                },
                metadata,
            );
            return row;
        });
    },
    async change(
        actor: Principal,
        id: string,
        input: unknown,
        operation: "update" | "delete" | "restore",
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor),
            patch = operation === "update" ? stopPatch.parse(input) : {};
        return transaction(async (database) => {
            await stopRepository.lock(database, schoolId, id);
            const before = await stopRepository.find(schoolId, id, database);
            if (
                !before ||
                (operation === "restore" ? !before.deletedAt : before.deletedAt)
            ) {
                throw new NotFoundError("Stop not found");
            }
            const data = { ...before, ...patch };
            if (!data.allowsPickup && !data.allowsDropoff) {
                throw new ValidationError(
                    "A stop must support pickup or dropoff",
                );
            }
            const after = await stopRepository.update(database, schoolId, id, {
                ...patch,
                ...(operation === "delete"
                    ? { deletedAt: new Date() }
                    : operation === "restore"
                      ? { deletedAt: null }
                      : {}),
            });
            await recordAudit(
                database,
                actor,
                {
                    action: "stop." + operation,
                    subjectKind: "STOP",
                    subjectReference: id,
                    before,
                    after,
                },
                metadata,
            );
            return after;
        });
    },
};
