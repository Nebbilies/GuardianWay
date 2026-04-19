import express from "express";
import cors from "cors";
import busStopRoutes from "./routes/busStop.routes";
import busRouteRoutes from "./routes/busRoute.routes";
import busRoutes from "./routes/bus.routes";
import userRoutes from "./routes/user.routes";
export { default as prisma } from "./config/prisma";
export * from "./config/prisma";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/bus-stops", busStopRoutes);
app.use("/api/bus-routes", busRouteRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/users", userRoutes);
app.get("/", (req: Request, res: any) => {
    res.send("Hello, api is on!");
})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

