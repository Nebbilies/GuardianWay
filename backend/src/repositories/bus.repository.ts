import {Bus, BusStatus} from "@prisma/client";
import {db, requireCurrentSchoolId} from "../config/tenant-db";
import {NotFoundError} from "../errors/http-errors";

export interface GetAllBusesParams {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    status?: BusStatus;
}

export type CreateBusInput = Pick<Bus, "licensePlate" | "model" | "capacity" | "status">;
export type UpdateBusInput = Partial<Pick<Bus, "licensePlate" | "model" | "capacity" | "status">>;

// Tenant scoping is automatic: db() returns a client that injects `schoolId` into
// every read/updateMany/deleteMany here. Creates supply it via requireCurrentSchoolId().
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

        const [data, metadata] = await db().bus.paginate({
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
        return db().bus.create({
            data: { ...data, schoolId: requireCurrentSchoolId() },
        });
    }

    async update(id: string, data: UpdateBusInput): Promise<Bus> {
        // updateMany's where is tenant-scoped by the extension, so a cross-tenant id
        // updates nothing -> count 0 -> NotFound.
        const { count } = await db().bus.updateMany({ where: { id, deletedAt: null }, data });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy xe buýt");
        }
        return db().bus.findFirstOrThrow({ where: { id } });
    }

    async delete(id: string): Promise<void> {
        const { count } = await db().bus.updateMany({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy xe buýt");
        }
    }
}

export const busRepository = new BusRepository();
