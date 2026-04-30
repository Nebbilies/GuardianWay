import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import busStopRoutes from "./routes/busStop.routes";
import busRouteRoutes from "./routes/busRoute.routes";
import busRoutes from "./routes/bus.routes";
import userRoutes from "./routes/user.routes";
import busTripRoutes from "./routes/busTrip.routes";
import publicRoutes from "./routes/public.routes";
import authRoutes from "./routes/auth.routes";
import {authenticate} from "./middlewares/auth.middleware";
import {authorize} from "./middlewares/authorize.middleware";
import {requestContext} from "./middlewares/request-context.middleware";
import {errorHandler, notFoundHandler} from "./middlewares/error.middleware";

const app = express();
const allowedOrigin = process.env.WEB_BASE_URL || "http://localhost:3000";

app.use(cors({
    origin: allowedOrigin,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(requestContext);

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

app.use("/api/users", authenticate, authorize(["ADMIN"]), userRoutes);
app.use("/api/buses", authenticate, authorize(["ADMIN", "STAFF"]), busRoutes);
app.use("/api/bus-routes", authenticate, authorize(["ADMIN", "STAFF"]), busRouteRoutes);
app.use("/api/bus-stops", authenticate, authorize(["ADMIN", "STAFF"]), busStopRoutes);
app.use("/api/bus-trips", authenticate, authorize(["ADMIN", "STAFF"]), busTripRoutes);

app.get("/", (_req, res) => {
    res.send("Hello, api is on!");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
