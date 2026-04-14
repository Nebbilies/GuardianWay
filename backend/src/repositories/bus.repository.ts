import {BusStatus} from "@prisma/client";
import prisma from "../config/prisma";

export interface GetAllBusesParams {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    status?: BusStatus;
}

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
}

export const busRepository = new BusRepository();