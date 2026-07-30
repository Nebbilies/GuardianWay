import prisma from "../config/prisma";
import { School } from "@prisma/client";
import { PaginatedResponse, SchoolAdmin } from "@gw/shared";
import { NotFoundError } from "../errors/http-errors";

export interface GetAllSchoolsParams {
    search?: string;
    deleted?: string; // "exclude" (default) | "only"
    page?: number;
    limit?: number;
    sort?: string;
}

export interface CreateSchoolData {
    name: string;
    address: string;
    slug: string;
}

export interface UpdateSchoolData {
    name: string;
    address: string;
    slug: string;
    isActive: boolean;
}

class SchoolRepository {
    async getAll(params: GetAllSchoolsParams = {}): Promise<PaginatedResponse<School>> {
        const searchTerm = params.search?.trim();
        const sortParam = params.sort || "createdAt";
        const isDesc = sortParam.startsWith("-");
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? "desc" : "asc";
        const deleted = params.deleted || "exclude";

        const whereClause: any = {};
        if (deleted === "exclude") {
            whereClause.deletedAt = null;
        } else if (deleted === "only") {
            whereClause.deletedAt = { not: null };
        }

        if (searchTerm) {
            whereClause.OR = [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { slug: { contains: searchTerm, mode: "insensitive" } },
            ];
        }

        const [data, metadata] = await prisma.school
            .paginate({
                where: whereClause,
                orderBy: { [sortBy]: sortOrder },
            })
            .withPages({
                page: params.page || 1,
                limit: params.limit || 10,
                includePageCount: true,
            });

        return { data, metadata };
    }

    async getActiveById(id: string): Promise<School | null> {
        return prisma.school.findFirst({ where: { id, deletedAt: null } });
    }

    async create(data: CreateSchoolData): Promise<School> {
        return prisma.school.create({ data });
    }

    async update(id: string, data: UpdateSchoolData): Promise<School> {
        const { count } = await prisma.school.updateMany({
            where: { id, deletedAt: null },
            data,
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy trường học");
        }
        return prisma.school.findFirstOrThrow({ where: { id } });
    }

    async softDelete(id: string): Promise<School> {
        const { count } = await prisma.school.updateMany({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy trường học");
        }
        return prisma.school.findFirstOrThrow({ where: { id } });
    }

    async restore(id: string): Promise<School> {
        const { count } = await prisma.school.updateMany({
            where: { id, deletedAt: { not: null } },
            data: { deletedAt: null },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy trường học đã xóa");
        }
        return prisma.school.findFirstOrThrow({ where: { id } });
    }

    async listAdmins(schoolId: string): Promise<SchoolAdmin[]> {
        return prisma.user.findMany({
            where: { schoolId, role: "ADMIN", deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                passwordSetupRequired: true,
                createdAt: true,
            },
            orderBy: { name: "asc" },
        }) as unknown as Promise<SchoolAdmin[]>;
    }
}

export const schoolRepository = new SchoolRepository();
