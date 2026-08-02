import { Router } from "express";
import prisma from "../config/prisma";
import redisClient, { isRedisReady } from "../config/redis";
import { checkReadiness } from "../services/health.service";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Liveness. Deliberately checks NOTHING external: a failing liveness probe makes
// Kubernetes restart the pod, so wiring a dependency in here means one database
// blip restarts every replica at once and the restart storm keeps it down.
router.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

// Readiness. Checks dependencies, because a failing readiness probe only removes
// this replica from the load balancer.
router.get("/readyz", asyncHandler(async (_req, res) => {
    const report = await checkReadiness({
        pingDb: () => prisma.$queryRaw`SELECT 1`,
        pingRedis: async () => {
            if (!isRedisReady()) throw new Error("redis not connected");
            return redisClient.ping();
        },
    });

    // The status code is for the orchestrator; the body is for humans.
    res.status(report.status === "ok" ? 200 : 503).json(report);
}));

export default router;
