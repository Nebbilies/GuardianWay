import { transaction, type Database } from "../../../../config/database";
import { NotFoundError } from "../../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../../http/principal";
import { requireLinkedAccount } from "../../../system/accounts";
import { recordAudit, type RequestMetadata } from "../../../system/audit";
import { lockStudent } from "..";
import { guardianRepository } from "./guardian-link.repository";
import { guardianBody } from "./guardian-link.contracts";
export function readGuardianLinks(
    schoolId: string,
    studentId: string,
    database?: Database,
) {
    return guardianRepository.list(schoolId, studentId, database);
}
export async function closeStudentGuardians(
    database: Database,
    actor: Principal,
    studentId: string,
    at: Date,
    reason: string,
    metadata: RequestMetadata,
) {
    const { schoolId } = requireSchoolAdmin(actor);
    const rows = await guardianRepository.list(schoolId, studentId, database);
    for (const row of rows.filter((row) => !row.effectiveTo)) {
        const end = new Date(
            Math.max(at.getTime(), row.effectiveFrom.getTime() + 1),
        );
        await guardianRepository.close(
            database,
            schoolId,
            studentId,
            end,
            reason,
            row.id,
        );
        await recordAudit(
            database,
            actor,
            {
                action: "guardian.closed",
                subjectKind: "GUARDIAN_LINK",
                subjectReference: row.id,
                before: row,
                after: { effectiveTo: end },
                reason,
            },
            metadata,
        );
    }
}
export const guardianService = {
    async create(
        actor: Principal,
        studentId: string,
        input: unknown,
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = guardianBody.parse(input);
        return transaction(async (database) => {
            await lockStudent(database, schoolId, studentId);
            await requireLinkedAccount(
                database,
                schoolId,
                data.guardianAccountId,
                "PARENT",
            );
            const row = await guardianRepository.create(database, {
                ...data,
                schoolId,
                studentId,
                confirmedById: actor.accountId,
                effectiveFrom: new Date(),
            });
            await recordAudit(
                database,
                actor,
                {
                    action: "guardian.created",
                    subjectKind: "GUARDIAN_LINK",
                    subjectReference: row.id,
                    after: row,
                },
                metadata,
            );
            return row;
        });
    },
    async close(
        actor: Principal,
        studentId: string,
        id: string,
        reason: string,
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor);
        return transaction(async (database) => {
            await lockStudent(database, schoolId, studentId);
            const row = await guardianRepository.find(
                database,
                schoolId,
                studentId,
                id,
            );
            if (!row) {
                throw new NotFoundError("Open guardian link not found");
            }
            const at = new Date(
                Math.max(Date.now(), row.effectiveFrom.getTime() + 1),
            );
            await guardianRepository.close(
                database,
                schoolId,
                studentId,
                at,
                reason,
                id,
            );
            await recordAudit(
                database,
                actor,
                {
                    action: "guardian.closed",
                    subjectKind: "GUARDIAN_LINK",
                    subjectReference: id,
                    before: row,
                    after: { effectiveTo: at },
                    reason,
                },
                metadata,
            );
            return { ...row, effectiveTo: at, reason };
        });
    },
};
