import { transaction, type Database } from "../../../../config/database";
import { ConflictError, NotFoundError } from "../../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../../http/principal";
import { recordAudit, type RequestMetadata } from "../../../system/audit";
import { lockStudent } from "..";
import { cardRepository } from "./student-card.repository";
import { cardBody } from "./student-card.contracts";
export function readStudentCards(
    schoolId: string,
    studentId: string,
    database?: Database,
) {
    return cardRepository.list(schoolId, studentId, database);
}
export async function closeStudentCards(
    database: Database,
    actor: Principal,
    studentId: string,
    at: Date,
    reason: string,
    metadata: RequestMetadata,
) {
    const { schoolId } = requireSchoolAdmin(actor);
    for (const row of (
        await cardRepository.list(schoolId, studentId, database)
    ).filter((row) => !row.effectiveTo)) {
        const end = new Date(
            Math.max(at.getTime(), row.effectiveFrom.getTime() + 1),
        );
        await cardRepository.close(
            database,
            schoolId,
            studentId,
            row.id,
            end,
            actor.accountId,
            reason,
        );
        await recordAudit(
            database,
            actor,
            {
                action: "card.revoked",
                subjectKind: "STUDENT_CARD_ASSIGNMENT",
                subjectReference: row.id,
                before: row,
                after: { effectiveTo: end },
                reason,
            },
            metadata,
        );
    }
}
export const cardService = {
    async assign(
        actor: Principal,
        studentId: string,
        input: unknown,
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = cardBody.parse(input);
        return transaction(async (database) => {
            await lockStudent(database, schoolId, studentId);
            if (
                await cardRepository.assigned(
                    database,
                    schoolId,
                    data.technology,
                    data.cardUid,
                )
            ) {
                throw new ConflictError(
                    "Card already has an open assignment",
                    "CARD_ALREADY_ASSIGNED",
                );
            }
            const row = await cardRepository.create(database, {
                ...data,
                schoolId,
                studentId,
                assignedById: actor.accountId,
                effectiveFrom: new Date(),
            });
            await recordAudit(
                database,
                actor,
                {
                    action: "card.assigned",
                    subjectKind: "STUDENT_CARD_ASSIGNMENT",
                    subjectReference: row.id,
                    after: row,
                },
                metadata,
            );
            return row;
        });
    },
    async revoke(
        actor: Principal,
        studentId: string,
        id: string,
        reason: string,
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor);
        return transaction(async (database) => {
            await lockStudent(database, schoolId, studentId);
            const row = await cardRepository.find(
                database,
                schoolId,
                studentId,
                id,
            );
            if (!row) {
                throw new NotFoundError("Open card assignment not found");
            }
            const at = new Date(
                Math.max(Date.now(), row.effectiveFrom.getTime() + 1),
            );
            await cardRepository.close(
                database,
                schoolId,
                studentId,
                id,
                at,
                actor.accountId,
                reason,
            );
            await recordAudit(
                database,
                actor,
                {
                    action: "card.revoked",
                    subjectKind: "STUDENT_CARD_ASSIGNMENT",
                    subjectReference: id,
                    before: row,
                    after: { effectiveTo: at },
                    reason,
                },
                metadata,
            );
            return {
                ...row,
                effectiveTo: at,
                revokedById: actor.accountId,
                reason,
            };
        });
    },
};
