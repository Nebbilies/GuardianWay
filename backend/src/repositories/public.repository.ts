import prisma, {BusStatus, BusTripStatus} from '../config/prisma'

export interface LandingProofAggregate {
    activeRoutes: number
    activeBuses: number
    schoolStops: number
    completedTripsLast30Days: number
    trackingLogsLast24Hours: number
    latestTrackingAt: Date | null
}

class PublicRepository {
    async getLandingProofAggregate(): Promise<LandingProofAggregate> {
        const now = new Date()
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(now.getDate() - 30)

        const twentyFourHoursAgo = new Date(now)
        twentyFourHoursAgo.setHours(now.getHours() - 24)

        const [activeRoutes, activeBuses, schoolStops, completedTripsLast30Days, trackingLogsResult] = await Promise.all([
            prisma.busRoute.count({
                where: {
                    deletedAt: null,
                },
            }),
            prisma.bus.count({
                where: {
                    deletedAt: null,
                    status: BusStatus.ACTIVE,
                },
            }),
            prisma.busStop.count({
                where: {
                    deletedAt: null,
                    isSchoolStop: true,
                },
            }),
            prisma.busTrip.count({
                where: {
                    deletedAt: null,
                    status: BusTripStatus.COMPLETED,
                    scheduledStartTime: {
                        gte: thirtyDaysAgo,
                    },
                },
            }),
            prisma.trackingLog.aggregate({
                where: {
                    recordedAt: {
                        gte: twentyFourHoursAgo,
                    },
                },
                _count: {
                    id: true,
                },
                _max: {
                    recordedAt: true,
                },
            }),
        ])

        return {
            activeRoutes,
            activeBuses,
            schoolStops,
            completedTripsLast30Days,
            trackingLogsLast24Hours: trackingLogsResult._count.id,
            latestTrackingAt: trackingLogsResult._max.recordedAt,
        }
    }
}

export const publicRepository = new PublicRepository()
