import { z } from "zod";
export const landingProofSchema = z.object({
    source: z.literal("live"),
    generatedAt: z.iso.datetime(),
    metrics: z.object({
        activeRoutes: z.number().int().nonnegative(),
        activeBuses: z.number().int().nonnegative(),
        schoolStops: z.number().int().nonnegative(),
        completedTripsLast30Days: z.number().int().nonnegative(),
        trackingLogsLast24Hours: z.number().int().nonnegative(),
        latestTrackingAt: z.iso.datetime().nullable(),
    }),
});
