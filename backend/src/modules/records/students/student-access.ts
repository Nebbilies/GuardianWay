import type { Database } from "../../../config/database";
import { NotFoundError } from "../../../errors/http-errors";
import { studentRepository } from "./student.repository";
export async function requireStudent(
    schoolId: string,
    id: string,
    database?: Database,
    includeDeleted = false,
) {
    const student = await studentRepository.find(schoolId, id, database);
    if (!student || (!includeDeleted && student.deletedAt)) {
        throw new NotFoundError("Student not found");
    }
    return student;
}
export async function lockStudent(
    database: Database,
    schoolId: string,
    id: string,
) {
    await studentRepository.lock(database, schoolId, id);
    return requireStudent(schoolId, id, database);
}
