import {db, requireCurrentSchoolId} from "../config/tenant-db";
import {BusStop} from "@prisma/client";
import {PaginatedResponse} from "@gw/shared"
import {NotFoundError} from "../errors/http-errors";

export interface GetAllBusStopsParams {
    search?: string;
    isSchoolStop?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
}

export type CreateBusStopInput = Pick<BusStop, "name" | "address" | "latitude" | "longitude" | "isSchoolStop">;
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

        const [data, metadata] = await db().busStop.paginate({
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
        return db().busStop.create({
            data: { ...data, schoolId: requireCurrentSchoolId() },
        });
    }

    async edit(id: string, data: EditBusStopInput): Promise<BusStop> {
        const { count } = await db().busStop.updateMany({ where: { id, deletedAt: null }, data });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy điểm dừng");
        }
        return db().busStop.findFirstOrThrow({ where: { id } });
    }

    async delete(id: string): Promise<BusStop> {
        const { count } = await db().busStop.updateMany({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy điểm dừng");
        }
        return db().busStop.findFirstOrThrow({ where: { id } });
    }
}

export const busStopRepository = new BusStopRepository();
