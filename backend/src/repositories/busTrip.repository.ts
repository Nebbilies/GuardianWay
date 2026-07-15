import {BusTripStatus, Prisma, TripType} from "@prisma/client";
import prisma from "../config/prisma";
import {PaginatedResponse} from "@gw/shared";
import {NotFoundError} from "../errors/http-errors";

export interface GetAllBusTripsParams {
    search?: string;
    status?: BusTripStatus;
    routeId?: string;
    busId?: string;
    driverId?: string;
    tripType?: TripType;
    // calendar day (YYYY-MM-DD) to filter by scheduled start.
    date?: string;
    page?: number;
    limit?: number;
    sort?: string;
    // undefined => SUPER_ADMIN, no tenant filter.
    schoolId?: string;
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
    schoolId: string;
    routeId: string;
    busId: string;
    driverId: string;
    tripType: TripType;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
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
            tripType: params.tripType,
            schoolId: params.schoolId,
        };

        if (params.date) {
            const dayStart = new Date(`${params.date}T00:00:00.000Z`);
            if (!isNaN(dayStart.getTime())) {
                const dayEnd = new Date(dayStart);
                dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
                // trips scheduled to start on that calendar day (UTC).
                whereClause.scheduledStartTime = {gte: dayStart, lt: dayEnd};
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
        const owned = await prisma.busTrip.findFirst({
            where: {id, schoolId: data.schoolId, deletedAt: null},
            select: {id: true},
        });
        if (!owned) {
            throw new NotFoundError("Không tìm thấy chuyến đi");
        }
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

    async delete(id: string, schoolId: string): Promise<void> {
        const owned = await prisma.busTrip.findFirst({
            where: {id, schoolId, deletedAt: null},
            select: {id: true},
        });
        if (!owned) {
            throw new NotFoundError("Không tìm thấy chuyến đi");
        }
        await prisma.busTrip.update({
            where: {id},
            data: {
                deletedAt: new Date(),
            }
        });
    }
}

export const busTripRepository = new BusTripRepository();
