import {Bus, BusStatus} from "@prisma/client";
import prisma from "../config/prisma";
import {NotFoundError} from "../errors/http-errors";

export interface GetAllBusesParams {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    status?: BusStatus;
    // undefined => SUPER_ADMIN, no tenant filter.
    schoolId?: string;
}

export type CreateBusInput = Pick<Bus, "schoolId" | "licensePlate" | "model" | "capacity" | "status">;
export type UpdateBusInput = Partial<Pick<Bus, "licensePlate" | "model" | "capacity" | "status">>;

class BusRepository {
    async getAll(params: GetAllBusesParams = {}) {
        const searchTerm = params.search?.trim();
        const sortParam = params?.sort || 'createdAt';
        const isDesc = sortParam.startsWith('-');
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? 'desc' : 'asc';

        const whereClause: any = {
            deletedAt: null,
            status: params.status,
            schoolId: params.schoolId,
        };

        if (searchTerm) {
            whereClause.OR = [
                {
                    licensePlate: {
                        contains: searchTerm,
                    }
                },
            ];
        }

        const [data, metadata] = await prisma.bus.paginate({
            where: whereClause,
            orderBy: { [sortBy]: sortOrder },
        }).withPages({
            page: params?.page || 1,
            limit: params?.limit || 10,
            includePageCount: true,
        });

        return {
            data,
            metadata,
        };
    }

    async create(data: CreateBusInput): Promise<Bus> {
        return prisma.bus.create({
            data,
        });
    }

    async update(id: string, schoolId: string, data: UpdateBusInput): Promise<Bus> {
        await this.assertOwned(id, schoolId);
        return prisma.bus.update({
            where: { id },
            data,
        });
    }

    async delete(id: string, schoolId: string): Promise<void> {
        await this.assertOwned(id, schoolId);
        await prisma.bus.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // Tenant guard: Prisma `update`/`delete` take a unique `where` (id only), so we
    // verify the row belongs to the caller's school before mutating it.
    private async assertOwned(id: string, schoolId: string): Promise<void> {
        const existing = await prisma.bus.findFirst({
            where: {id, schoolId, deletedAt: null},
            select: {id: true},
        });
        if (!existing) {
            throw new NotFoundError("Không tìm thấy xe buýt");
        }
    }
}

export const busRepository = new BusRepository();