import {BusRoute} from "@prisma/client";
import {PaginatedResponse} from "@gw/shared"
import prisma from "../config/prisma";

export interface GetAllBusRoutesParams {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

class BusRouteRepository {
    async getAll(params: GetAllBusRoutesParams = {}): Promise<PaginatedResponse<BusRoute>> {
        const searchTerm = params.search?.trim();
        const sortParam = params?.sort || 'name';
        const isDesc = sortParam.startsWith('-');
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? 'desc' : 'asc';

        const whereClause: any = {
            deletedAt: null,
        };

        if (searchTerm) {
            whereClause.name = {
                search: searchTerm
            }
        }

        const [data, metadata] = await prisma.busRoute.paginate({
            where: whereClause,
            orderBy: {
                [sortBy]: sortOrder
            }
        }).withPages({
            page: params.page || 1,
            limit: params.limit || 10,
            includePageCount: true,
        })

        return {
            data,
            metadata,
        };
    }

    async create(data: Pick<BusRoute, "name" | "description">): Promise<BusRoute> {
        return prisma.busRoute.create({
            data,
        });
    }

    async edit(data: Pick<BusRoute, "id" | "name" | "description">): Promise<BusRoute> {
        return prisma.busRoute.update({
            where: {
                id: data.id,
            },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await prisma.busRoute.update({
            where: {
                id,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}

export const busRouteRepository = new BusRouteRepository();