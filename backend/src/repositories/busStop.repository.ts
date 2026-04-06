import prisma from "../config/prisma";
import {BusStop} from "@prisma/client";
import {PaginatedResult} from "@gw/shared"

export interface GetAllBusStopsParams {
    search?: string;
    isSchoolStop?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
}

class BusStopRepository {
    async getAll(params: GetAllBusStopsParams = {}): Promise<PaginatedResult<BusStop>> {
        const sortParam = params?.sort || 'name';
        const isDesc = sortParam.startsWith('-');
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? 'desc' : 'asc';

        const [data, metadata] = await prisma.busStop.paginate({
            where: {
                name: params.search ? { contains: params.search, mode: 'insensitive' } : undefined,
                isSchoolStop: params.isSchoolStop,
                deletedAt: null,
            },
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

    async create(data: Pick<BusStop, "name" | "address" | "latitude" | "longitude" | "isSchoolStop">): Promise<BusStop> {
        return prisma.busStop.create({
            data,
        });
    }

    async edit(data: Pick<BusStop, "id" | "name" | "address" | "latitude" | "longitude" | "isSchoolStop">): Promise<BusStop> {
        const { id, ... updateData } = data;
        return prisma.busStop.update({
            where: { id },
            data: updateData,
        })
    }

    async delete(id: string): Promise<BusStop> {
        return prisma.busStop.delete({
            where: { id },
        })
    }
}

export const busStopRepository = new BusStopRepository();