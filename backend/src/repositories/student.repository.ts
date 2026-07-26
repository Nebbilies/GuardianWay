import {Prisma} from "@prisma/client";
import {db, requireCurrentSchoolId} from "../config/tenant-db";
import {NotFoundError} from "../errors/http-errors";

export interface GetAllStudentsParams {
    search?: string;
    studentClass?: string;
    parentId?: string;
    deleted?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

export interface CreateStudentInput {
    fullName: string;
    studentId: string;
    studentClass: string;
    dateOfBirth: Date;
    parentId?: string | null;
}

export type UpdateStudentInput = Partial<CreateStudentInput>;

const PARENT_INCLUDE = {
    parent: { select: { id: true, name: true, email: true, phoneNumber: true } },
} satisfies Prisma.StudentProfileInclude;

// StudentProfile is tenant-scoped by the db() extension, so no schoolId is passed
// in here; create supplies it via requireCurrentSchoolId().
class StudentRepository {
    async getAll(params: GetAllStudentsParams = {}) {
        const searchTerm = params.search?.trim();
        const sortParam = params.sort || "fullName";
        const isDesc = sortParam.startsWith("-");
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? "desc" : "asc";
        const deleted = params.deleted || "exclude";

        const whereClause: any = {
            studentClass: params.studentClass,
            parentId: params.parentId,
        };
        if (deleted === "exclude") whereClause.deletedAt = null;
        else if (deleted === "only") whereClause.deletedAt = { not: null };

        if (searchTerm) {
            whereClause.OR = [
                { fullName: { contains: searchTerm, mode: "insensitive" } },
                { studentId: { contains: searchTerm, mode: "insensitive" } },
            ];
        }

        const [data, metadata] = await db().studentProfile.paginate({
            where: whereClause,
            orderBy: { [sortBy]: sortOrder },
            include: PARENT_INCLUDE,
        }).withPages({
            page: params.page || 1,
            limit: params.limit || 10,
            includePageCount: true,
        });

        return { data, metadata };
    }

    async getById(id: string) {
        return db().studentProfile.findFirst({
            where: { id, deletedAt: null },
            include: PARENT_INCLUDE,
        });
    }

    async create(data: CreateStudentInput) {
        return db().studentProfile.create({
            data: { ...data, schoolId: requireCurrentSchoolId() },
            include: PARENT_INCLUDE,
        });
    }

    async update(id: string, data: UpdateStudentInput) {
        const { count } = await db().studentProfile.updateMany({ where: { id, deletedAt: null }, data });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy học sinh");
        }
        return db().studentProfile.findFirstOrThrow({ where: { id }, include: PARENT_INCLUDE });
    }

    // Soft-delete also releases the card so its hash can be reused.
    async delete(id: string): Promise<void> {
        const { count } = await db().studentProfile.updateMany({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date(), cardTokenHash: null },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy học sinh");
        }
    }

    async restore(id: string) {
        const { count } = await db().studentProfile.updateMany({
            where: { id, deletedAt: { not: null } },
            data: { deletedAt: null },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy học sinh đã xóa");
        }
        return db().studentProfile.findFirstOrThrow({ where: { id }, include: PARENT_INCLUDE });
    }

    async setCardHash(id: string, cardTokenHash: string | null) {
        const { count } = await db().studentProfile.updateMany({
            where: { id, deletedAt: null },
            data: { cardTokenHash },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy học sinh");
        }
        return db().studentProfile.findFirstOrThrow({ where: { id }, include: PARENT_INCLUDE });
    }
}

export const studentRepository = new StudentRepository();
