import {BusTripStatus, Prisma, TripType} from "@prisma/client";
import {db, requireCurrentSchoolId} from "../config/tenant-db";
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
}

const TRIP_INCLUDE = {
    route: true,
    bus: true,
    driver: {
        include: {
            user: true,
        },
    },
} satisfies Prisma.BusTripInclude;

export type BusTripWithDetails = Prisma.BusTripGetPayload<{ include: typeof TRIP_INCLUDE }>;

export interface UpsertBusTripInput {
    routeId: string;
    busId: string;
    driverId: string;
    tripType: TripType;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    status: BusTripStatus;
}

// db() auto-scopes BusTrip reads/updateMany by schoolId; create supplies it.
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

        const [data, metadata] = await db().busTrip.paginate({
            where: whereClause,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: TRIP_INCLUDE,
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
        return db().busTrip.create({
            data: { ...data, schoolId: requireCurrentSchoolId() },
            include: TRIP_INCLUDE,
        });
    }

    async update(id: string, data: UpsertBusTripInput): Promise<BusTripWithDetails> {
        const { count } = await db().busTrip.updateMany({ where: { id, deletedAt: null }, data });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy chuyến đi");
        }
        return db().busTrip.findFirstOrThrow({ where: { id }, include: TRIP_INCLUDE });
    }

    async delete(id: string): Promise<void> {
        const { count } = await db().busTrip.updateMany({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        if (count === 0) {
            throw new NotFoundError("Không tìm thấy chuyến đi");
        }
    }
}

export const busTripRepository = new BusTripRepository();
