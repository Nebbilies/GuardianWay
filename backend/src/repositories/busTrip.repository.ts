import {BusTripStatus, Prisma} from "@prisma/client";
import prisma from "../config/prisma";
import {PaginatedResponse} from "@gw/shared";

export interface GetAllBusTripsParams {
    search?: string;
    status?: BusTripStatus;
    routeId?: string;
    busId?: string;
    driverId?: string;
    date?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

export type BusTripWithDetails = Prisma.BusTripGetPayload<{
    include: {
        route: true;
        bus: true;
        driver: {
            include: {
                user: true;
            }
        }
    }
}>;

export interface UpsertBusTripInput {
    routeId: string;
    busId: string;
    driverId: string;
    date: Date;
    startTime: Date;
    endTime?: Date | null;
    status: BusTripStatus;
}

class BusTripRepository {
    async getAll(params: GetAllBusTripsParams = {}): Promise<PaginatedResponse<BusTripWithDetails>> {
        const searchTerm = params.search?.trim();
        const sortParam = params.sort || "createdAt";
        const isDesc = sortParam.startsWith("-");
        const sortBy = isDesc ? sortParam.substring(1) : sortParam;
        const sortOrder = isDesc ? "desc" : "asc";

        const whereClause: any = {
            deletedAt: null,
            status: params.status,
            routeId: params.routeId,
            busId: params.busId,
            driverId: params.driverId,
        };

        if (params.date) {
            const date = new Date(params.date);
            if (!isNaN(date.getTime())) {
                whereClause.date = date;
            }
        }

        if (searchTerm) {
            whereClause.OR = [
                {
                    route: {
                        name: {
                            contains: searchTerm,
                            mode: "insensitive"
                        }
                    }
                },
                {
                    bus: {
                        licensePlate: {
                            contains: searchTerm,
                            mode: "insensitive"
                        }
                    }
                },
                {
                    driver: {
                        user: {
                            name: {
                                contains: searchTerm,
                                mode: "insensitive"
                            }
                        }
                    }
                }
            ];
        }

        const [data, metadata] = await prisma.busTrip.paginate({
            where: whereClause,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                route: true,
                bus: true,
                driver: {
                    include: {
                        user: true,
                    }
                }
            }
        }).withPages({
            page: params.page || 1,
            limit: params.limit || 10,
            includePageCount: true,
        });

        return {
            data,
            metadata,
        };
    }

    async create(data: UpsertBusTripInput): Promise<BusTripWithDetails> {
        return prisma.busTrip.create({
            data,
            include: {
                route: true,
                bus: true,
                driver: {
                    include: {
                        user: true,
                    }
                }
            }
        });
    }

    async update(id: string, data: UpsertBusTripInput): Promise<BusTripWithDetails> {
        return prisma.busTrip.update({
            where: {id},
            data,
            include: {
                route: true,
                bus: true,
                driver: {
                    include: {
                        user: true,
                    }
                }
            }
        });
    }

    async delete(id: string): Promise<void> {
        await prisma.busTrip.update({
            where: {id},
            data: {
                deletedAt: new Date(),
            }
        });
    }
}

export const busTripRepository = new BusTripRepository();
