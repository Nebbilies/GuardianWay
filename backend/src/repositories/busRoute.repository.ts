import {BusRoute} from "@prisma/client";
import {PaginatedResponse} from "@gw/shared"
import prisma from "../config/prisma";
import {NotFoundError} from "../errors/http-errors";

export interface GetAllBusRoutesParams {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    // undefined => SUPER_ADMIN, no tenant filter.
    schoolId?: string;
}

export type RouteStopInput = {
    stopId: string;
    stopOrder: number;
    scheduledTime?: Date | null;
}

export type CreateBusRouteInput = Pick<BusRoute, "name" | "description"> & {
    stops: RouteStopInput[];
}

export type EditBusRouteInput = Pick<BusRoute, "id" | "name" | "description"> & {
    stops: RouteStopInput[];
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
            schoolId: params.schoolId,
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
            },
            include: {
                routeStops: {
                    include: {
                        stop: true,
                    }
                }
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

    async create(data: {
        schoolId: string;
        name: string;
        stops: RouteStopInput[];
        description: string | null
    }): Promise<BusRoute> {
        return prisma.$transaction(async (tx) => {
            const {stops, ...busRouteData} = data;
            const busRoute = await tx.busRoute.create({
                data: busRouteData,
            });

            if (stops.length > 0) {
                await tx.routeStop.createMany({
                    data: stops.map((stop) => ({
                        routeId: busRoute.id,
                        stopId: stop.stopId,
                        stopOrder: stop.stopOrder,
                        scheduledTime: stop.scheduledTime,
                    })),
                });
            }

            return busRoute;
        });
    }

    async edit(data: {
        id: string;
        schoolId: string;
        name: string;
        stops: RouteStopInput[];
        description: string | null
    }): Promise<BusRoute> {
        return prisma.$transaction(async (tx) => {
            const {id, schoolId, stops, ...busRouteData} = data;

            const owned = await tx.busRoute.findFirst({
                where: {id, schoolId, deletedAt: null},
                select: {id: true},
            });
            if (!owned) {
                throw new NotFoundError("Không tìm thấy tuyến đường");
            }

            const busRoute = await tx.busRoute.update({
                where: {
                    id,
                },
                data: busRouteData,
            });

            await tx.routeStop.deleteMany({
                where: {
                    routeId: id,
                },
            });

            if (stops.length > 0) {
                await tx.routeStop.createMany({
                    data: stops.map((stop) => ({
                        routeId: id,
                        stopId: stop.stopId,
                        stopOrder: stop.stopOrder,
                        scheduledTime: stop.scheduledTime,
                    })),
                });
            }

            return busRoute;
        });
    }

    async delete(id: string, schoolId: string): Promise<void> {
        const owned = await prisma.busRoute.findFirst({
            where: {id, schoolId, deletedAt: null},
            select: {id: true},
        });
        if (!owned) {
            throw new NotFoundError("Không tìm thấy tuyến đường");
        }
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