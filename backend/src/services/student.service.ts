import crypto from "crypto";
import {Role} from "@prisma/client";
import {
    studentRepository,
    GetAllStudentsParams,
} from "../repositories/student.repository";
import {db, currentSchoolId} from "../config/tenant-db";
import {NotFoundError, ValidationError} from "../errors/http-errors";

interface CreateStudentPayload {
    fullName: string;
    studentId: string;
    studentClass: string;
    dateOfBirth: string;
    parentId?: string | null;
}

type UpdateStudentPayload = Partial<CreateStudentPayload>;

// A physical card's raw id is never stored — only this deterministic hash, which the
// check-in flow will recompute to look the student up.
function hashCard(rawCardId: string): string {
    return crypto.createHash("sha256").update(rawCardId.trim()).digest("hex");
}

class StudentService {
    async getAll(params: GetAllStudentsParams = {}) {
        return studentRepository.getAll(params);
    }

    async getById(id: string) {
        const student = await studentRepository.getById(id);
        if (!student) {
            throw new NotFoundError("Không tìm thấy học sinh");
        }
        return student;
    }

    async create(payload: CreateStudentPayload) {
        await this.assertParentValid(payload.parentId);
        return studentRepository.create({
            fullName: payload.fullName,
            studentId: payload.studentId,
            studentClass: payload.studentClass,
            dateOfBirth: this.parseDob(payload.dateOfBirth),
            parentId: payload.parentId ?? null,
        });
    }

    async update(id: string, payload: UpdateStudentPayload) {
        if (payload.parentId !== undefined) {
            await this.assertParentValid(payload.parentId);
        }
        return studentRepository.update(id, {
            fullName: payload.fullName,
            studentId: payload.studentId,
            studentClass: payload.studentClass,
            parentId: payload.parentId,
            ...(payload.dateOfBirth ? { dateOfBirth: this.parseDob(payload.dateOfBirth) } : {}),
        });
    }

    async delete(id: string) {
        return studentRepository.delete(id);
    }

    async restore(id: string) {
        return studentRepository.restore(id);
    }

    async assignCard(id: string, rawCardId: string) {
        return studentRepository.setCardHash(id, hashCard(rawCardId));
    }

    async removeCard(id: string) {
        return studentRepository.setCardHash(id, null);
    }

    private parseDob(value: string): Date {
        const dob = new Date(`${value.slice(0, 10)}T00:00:00Z`);
        if (isNaN(dob.getTime())) {
            throw new ValidationError("Ngày sinh không hợp lệ");
        }
        return dob;
    }

    // A parent must be a PARENT-role user in the same school. null clears the link.
    private async assertParentValid(parentId?: string | null): Promise<void> {
        if (!parentId) return;
        const parent = await db().user.findFirst({
            where: { id: parentId, role: Role.PARENT, schoolId: currentSchoolId(), deletedAt: null },
            select: { id: true },
        });
        if (!parent) {
            throw new ValidationError("Phụ huynh không hợp lệ hoặc không thuộc trường");
        }
    }
}

export const studentService = new StudentService();
