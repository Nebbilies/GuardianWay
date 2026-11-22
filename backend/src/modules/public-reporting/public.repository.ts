import prisma from "../../config/prisma";
export const publicRepository = {
    async aggregate(now: Date) {
        const school = { status: "ACTIVE", deletedAt: null };
        const [
            routes,
            activeBuses,
            schoolStops,
            completedTripsLast30Days,
            gps,
        ] = await Promise.all([
            prisma.$queryRaw<{ count: bigint }[]>`
                WITH current_plans AS (
                    SELECT DISTINCT ON (p.school_id, p.plan_key) p.id
                    FROM plan_version p JOIN school s ON s.id = p.school_id
                    WHERE s.status = 'ACTIVE' AND s.deleted_at IS NULL AND p.status = 'APPROVED'
                      AND p.effective_from <= (${now}::timestamptz AT TIME ZONE s.timezone)::date
                      AND (p.effective_to IS NULL OR p.effective_to >= (${now}::timestamptz AT TIME ZONE s.timezone)::date)
                    ORDER BY p.school_id, p.plan_key, p.version_no DESC
                ) SELECT count(*)::bigint AS count FROM planned_route r JOIN current_plans p ON p.id = r.plan_version_id
            `,
            prisma.vehicle.count({
                where: {
                    deletedAt: null,
                    status: "AVAILABLE",
                    schoolIdRef: school,
                },
            }),
            prisma.stop.count({
                where: {
                    deletedAt: null,
                    status: "ACTIVE",
                    kind: "SCHOOL",
                    schoolIdRef: school,
                },
            }),
            prisma.trip.count({
                where: {
                    status: "COMPLETED",
                    completedAt: {
                        gte: new Date(now.getTime() - 30 * 86400000),
                        lte: now,
                    },
                    schoolIdRef: school,
                },
            }),
            prisma.gpsPosition.aggregate({
                where: {
                    qualityStatus: "ACCEPTED",
                    measuredAt: {
                        gte: new Date(now.getTime() - 86400000),
                        lte: now,
                    },
                    schoolIdRef: school,
                },
                _count: { id: true },
                _max: { measuredAt: true },
            }),
        ]);
        return {
            activeRoutes: Number(routes[0]?.count ?? 0),
            activeBuses,
            schoolStops,
            completedTripsLast30Days,
            trackingLogsLast24Hours: gps._count.id,
            latestTrackingAt: gps._max.measuredAt?.toISOString() ?? null,
        };
    },
};
