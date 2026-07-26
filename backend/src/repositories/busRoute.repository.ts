import {BusRoute} from "@prisma/client";
import {PaginatedResponse} from "@gw/shared"
import {db, requireCurrentSchoolId} from "../config/tenant-db";
import {NotFoundError} from "../errors/http-errors";

export interface GetAllBusRoutesParams {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
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

// db() auto-scopes BusRoute reads/updateMany. RouteStop has no schoolId — it's
// reached only via a route we've already tenant-checked, so it needs no scoping.
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

        const [data, metadata] = await db().busRoute.paginate({
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
        name: string;
        stops: RouteStopInput[];
        description: string | null
    }): Promise<BusRoute> {
        const schoolId = requireCurrentSchoolId();
        return db().$transaction(async (tx) => {
            const {stops, ...busRouteData} = data;
            const busRoute = await tx.busRoute.create({
                data: { ...busRouteData, schoolId },
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
        name: string;
        stops: RouteStopInput[];
        description: string | null
    }): Promise<BusRoute> {
        return db().$transaction(async (tx) => {
            const {id, stops, ...busRouteData} = data;

            // updateMany is tenant-scoped; count 0 => not this tenant's route.
            const { count } = await tx.busRoute.updateMany({
                where: { id, deletedAt: null },
                data: busRouteData,
            });
            if (count === 0) {
                throw new NotFoundError("Không tìm thấy tuyến đường");
            }

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

            return tx.busRoute.findFirstOrThrow({ where: { id } });
        });
    }

    async delete(id: string): Promise<void> {
        const { count } = await db().busRoute.updateMany({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy tuyến đường");
        }
    }
}

export const busRouteRepository = new BusRouteRepository();
