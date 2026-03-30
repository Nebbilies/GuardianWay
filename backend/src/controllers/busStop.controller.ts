import { Request, Response } from "express";
import { busStopService } from "../services/busStop.service";

class BusStopController {
    async getAll(req: Request, res: Response) {
        try {
            const busStops = await busStopService.getAll();
            res.json(busStops);
        } catch (error) {
            console.error("Error fetching bus stops:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const busStop = await busStopService.create(req.body);
            res.status(201).json(busStop);
        } catch (error) {
            if (error instanceof Error && error.message === "Missing required bus stop fields") {
                return res.status(400).json({ message: error.message });
            }

            console.error("Error creating bus stop:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export const busStopController = new BusStopController();

