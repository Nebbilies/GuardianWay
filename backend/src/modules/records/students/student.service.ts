import { transaction } from "../../../config/database";
import { NotFoundError } from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import type { ListQuery } from "../../../http/contracts/pagination";
import { recordAudit, type RequestMetadata } from "../../system/audit";
import { studentRepository } from "./student.repository";
import { requireStudent } from "./student-access";
import { studentBody, studentPatch } from "./student.contracts";
import { readGuardianLinks, closeStudentGuardians } from "./guardian-links";
import { readStudentCards, closeStudentCards } from "./cards";
export const studentService = {
    list(actor: Principal, query: ListQuery, exportAll = false) {
        const { schoolId } = requireSchoolAdmin(actor);
        return studentRepository.list(schoolId, query, exportAll);
    },
    async get(actor: Principal, id: string) {
        const { schoolId } = requireSchoolAdmin(actor),
            student = await requireStudent(schoolId, id);
        const [guardians, cards] = await Promise.all([
            readGuardianLinks(schoolId, id),
            readStudentCards(schoolId, id),
        ]);
        return { ...student, guardians, cards };
    },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = studentBody.parse(input);
        return transaction(async (database) => {
            const student = await studentRepository.create(database, {
                ...data,
                schoolId,
            });
            await recordAudit(
                database,
                actor,
                {
                    action: "student.created",
                    subjectKind: "STUDENT",
                    subjectReference: student.id,
                    after: student,
                },
                metadata,
            );
            return student;
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
            data = operation === "update" ? studentPatch.parse(input) : {};
        return transaction(async (database) => {
            await studentRepository.lock(database, schoolId, id);
            const before = await requireStudent(schoolId, id, database, true);
            if (
                operation === "restore" ? !before.deletedAt : before.deletedAt
            ) {
                throw new NotFoundError("Student not found");
            }
            const now = new Date();
            if (operation === "delete") {
                await closeStudentGuardians(
                    database,
                    actor,
                    id,
                    now,
                    "Student profile deleted",
                    metadata,
                );
                await closeStudentCards(
                    database,
                    actor,
                    id,
                    now,
                    "Student profile deleted",
                    metadata,
                );
            }
            const after = await studentRepository.update(
                database,
                schoolId,
                id,
                {
                    ...data,
                    ...(operation === "delete"
                        ? { deletedAt: now }
                        : operation === "restore"
                          ? { deletedAt: null }
                          : {}),
                },
            );
            await recordAudit(
                database,
                actor,
                {
                    action: "student." + operation,
                    subjectKind: "STUDENT",
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
