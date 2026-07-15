import prisma from "../config/prisma";
import {BusStop} from "@prisma/client";
import {PaginatedResponse} from "@gw/shared"
import {NotFoundError} from "../errors/http-errors";

export interface GetAllBusStopsParams {
    search?: string;
    isSchoolStop?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
    // undefined => SUPER_ADMIN, no tenant filter.
    schoolId?: string;
}

export type CreateBusStopInput = Pick<BusStop, "schoolId" | "name" | "address" | "latitude" | "longitude" | "isSchoolStop">;
export type EditBusStopInput = Pick<BusStop, "name" | "address" | "latitude" | "longitude" | "isSchoolStop">;

class BusStopRepository {
    async getAll(params: GetAllBusStopsParams = {}): Promise<PaginatedResponse<BusStop>> {
        const searchTerm = params.search?.trim();
        const sortParam = params?.sort || 'name';
        const isDesc = sortParam.startsWith('-');
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? 'desc' : 'asc';

        const whereClause: any = {
            isSchoolStop: params.isSchoolStop,
            deletedAt: null,
            schoolId: params.schoolId,
        };

        if (searchTerm) {
            whereClause.OR = [
                {
                    name: {
                        search: searchTerm
                    }
                },
                {
                    address: {
                        search: searchTerm
                    }
                }
            ];
        }

        const [data, metadata] = await prisma.busStop.paginate({
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

    async create(data: CreateBusStopInput): Promise<BusStop> {
        return prisma.busStop.create({
            data,
        });
    }

    async edit(id: string, schoolId: string, data: EditBusStopInput): Promise<BusStop> {
        await this.assertOwned(id, schoolId);
        return prisma.busStop.update({
            where: { id },
            data,
        })
    }

    async delete(id: string, schoolId: string): Promise<BusStop> {
        await this.assertOwned(id, schoolId);
        return prisma.busStop.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            }
        })
    }

    private async assertOwned(id: string, schoolId: string): Promise<void> {
        const existing = await prisma.busStop.findFirst({
            where: {id, schoolId, deletedAt: null},
            select: {id: true},
        });
        if (!existing) {
            throw new NotFoundError("Không tìm thấy điểm dừng");
        }
    }
}

export const busStopRepository = new BusStopRepository();