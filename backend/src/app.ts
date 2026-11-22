import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/system/auth/auth.routes";
import {
    schoolRouter,
    schoolContextRouter,
} from "./modules/system/schools/school.routes";
import { accountRouter } from "./modules/system/accounts/account.routes";
import { auditRouter } from "./modules/system/audit/audit.routes";
import { studentRouter } from "./modules/records/students/student.routes";
import { vehicleRouter } from "./modules/records/vehicles/vehicle.routes";
import { stopRouter } from "./modules/planning/stops/stop.routes";
import { driverRouter } from "./modules/records/drivers/driver.routes";
import { policyRouter } from "./modules/system/school-policies/policy.routes";
import { planRouter } from "./modules/planning/route-plans/plan.routes";
import { scheduleRouter } from "./modules/planning/schedules/schedule.routes";
import { tripRouter } from "./modules/operations/trips/trip.routes";
import { publicRouter } from "./modules/public-reporting/public.routes";
import healthRoutes from "./routes/health.routes";
import { authenticate } from "./middlewares/auth.middleware";
import { authorize } from "./middlewares/authorize.middleware";
import { requestContext } from "./middlewares/request-context.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import pinoHttp from "pino-http";
import { baseLogger } from "./utils/logger";
import { register } from "./utils/metrics";
import { metricsMiddleware } from "./middlewares/metrics.middleware";
import { resolveTrustProxyHops } from "./config/trust-proxy";

const app = express();
const allowedOrigin = process.env.WEB_BASE_URL || "http://localhost:3000";

app.set("trust proxy", resolveTrustProxyHops(process.env.TRUST_PROXY_HOPS));

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
    }),
);
app.use(
    helmet({
        // No TLS terminates in front of this service, so asserting HSTS would be a
        // claim the deployment cannot honour.
        strictTransportSecurity: false,
        // The API serves JSON only; CSP belongs on the HTML responses, which the
        // frontend app emits for itself.
        contentSecurityPolicy: false,
        frameguard: { action: "deny" },
        // JSON API responses never need to leak a referrer, so this is the strictest
        // setting. The portal's HTML uses "strict-origin-when-cross-origin" instead,
        // because ordinary same-origin navigation there depends on the referrer.
        referrerPolicy: { policy: "no-referrer" },
    }),
);
app.use(cookieParser());
app.use(express.json());
app.use(requestContext);

// Prometheus scrape endpoint — internal only (not proxied by nginx).
// Registered before pinoHttp/metricsMiddleware so scrapes aren't logged or self-recorded.
app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

// Liveness/readiness probes — registered before pinoHttp/metricsMiddleware for
// the same reason as /metrics: probe traffic fires every few seconds and must
// not flood the request logs or skew the Prometheus request metrics.
app.use(healthRoutes);

app.use(
    pinoHttp({
        logger: baseLogger,
        // Reuse the traceId assigned by requestContext so log req.id == x-request-id.
        genReqId: (req) =>
            (req as unknown as import("express").Request).traceId,
    }),
);
app.use(metricsMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use(
    "/api/users",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    accountRouter(),
);
app.use(
    "/api/schools/:schoolId/admins",
    authenticate,
    authorize(["PLATFORM_ADMIN"]),
    accountRouter(),
);
app.use(
    "/api/schools",
    authenticate,
    authorize(["PLATFORM_ADMIN"]),
    schoolRouter,
);
app.use(
    "/api/school-context",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    schoolContextRouter,
);
app.use(
    "/api/audit-logs",
    authenticate,
    authorize(["PLATFORM_ADMIN", "SCHOOL_ADMIN"]),
    auditRouter,
);
app.use(
    "/api/students",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    studentRouter,
);
app.use("/api/buses", authenticate, authorize(["SCHOOL_ADMIN"]), vehicleRouter);
app.use(
    "/api/bus-stops",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    stopRouter,
);
app.use(
    "/api/drivers",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    driverRouter,
);
app.use(
    "/api/school-policies",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    policyRouter,
);
app.use(
    "/api/route-plans",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    planRouter,
);
app.use(
    "/api/recurring-schedules",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    scheduleRouter,
);
app.use(
    "/api/bus-trips",
    authenticate,
    authorize(["SCHOOL_ADMIN"]),
    tripRouter,
);

app.get("/", (_req, res) => {
    res.send("Hello, api is on!");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
