import express from "express";
import cors from "cors";
import busStopRoutes from "./routes/busStop.routes";
import busRouteRoutes from "./routes/busRoute.routes";
export { default as prisma } from "./config/prisma";
export * from "./config/prisma";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/bus-stops", busStopRoutes);
app.use("/api/bus-routes", busRouteRoutes);

app.get("/", (req: Request, res: any) => {
    res.send("Hello, api is on!");
})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

