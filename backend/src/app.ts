import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import busStopRoutes from "./routes/busStop.routes";
import busRouteRoutes from "./routes/busRoute.routes";
import busRoutes from "./routes/bus.routes";
import userRoutes from "./routes/user.routes";
import schoolRoutes from "./routes/school.routes";
import busTripRoutes from "./routes/busTrip.routes";
import studentRoutes from "./routes/student.routes";
import auditRoutes from "./routes/audit.routes";
import publicRoutes from "./routes/public.routes";
import authRoutes from "./routes/auth.routes";
import {authenticate} from "./middlewares/auth.middleware";
import {tenantContext} from "./middlewares/tenant.middleware";
import {authorize} from "./middlewares/authorize.middleware";
import {requestContext} from "./middlewares/request-context.middleware";
import {errorHandler, notFoundHandler} from "./middlewares/error.middleware";
import pinoHttp from "pino-http";
import {baseLogger} from "./utils/logger";
import {register} from "./utils/metrics";
import {metricsMiddleware} from "./middlewares/metrics.middleware";

const app = express();
const allowedOrigin = process.env.WEB_BASE_URL || "http://localhost:3000";

app.use(cors({
    origin: allowedOrigin,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(requestContext);

// Prometheus scrape endpoint — internal only (not proxied by nginx).
// Registered before pinoHttp/metricsMiddleware so scrapes aren't logged or self-recorded.
app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.use(pinoHttp({
    logger: baseLogger,
    // Reuse the traceId assigned by requestContext so log req.id == x-request-id.
    genReqId: (req) => (req as unknown as import("express").Request).traceId,
}));
app.use(metricsMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

app.use("/api/users", authenticate, tenantContext, authorize(["SUPER_ADMIN", "ADMIN"]), userRoutes);
// SUPER_ADMIN has schoolId=null, so tenantContext resolves to the unscoped base
// client here — it is mounted purely so the audit trail knows who acted.
app.use("/api/schools", authenticate, tenantContext, authorize(["SUPER_ADMIN"]), schoolRoutes);
app.use("/api/buses", authenticate, tenantContext, authorize(["SUPER_ADMIN", "ADMIN"]), busRoutes);
app.use("/api/bus-routes", authenticate, tenantContext, authorize(["SUPER_ADMIN", "ADMIN"]), busRouteRoutes);
app.use("/api/bus-stops", authenticate, tenantContext, authorize(["SUPER_ADMIN", "ADMIN"]), busStopRoutes);
app.use("/api/bus-trips", authenticate, tenantContext, authorize(["SUPER_ADMIN", "ADMIN"]), busTripRoutes);
app.use("/api/students", authenticate, tenantContext, authorize(["SUPER_ADMIN", "ADMIN"]), studentRoutes);
app.use("/api/audit-logs", authenticate, tenantContext, authorize(["SUPER_ADMIN", "ADMIN"]), auditRoutes);

app.get("/", (_req, res) => {
    res.send("Hello, api is on!");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
