import { Request, Response } from "express";
import { busStopService } from "../services/busStop.service";
import { GetAllBusStopsParams } from "../repositories/busStop.repository";

class BusStopController {
    async getAll(req: Request, res: Response) {
        try {
            const { search, isSchoolStop, page, limit, sort } = req.query;

            const params: GetAllBusStopsParams = {};

            if (typeof search === 'string') params.search = search;
            if (isSchoolStop !== undefined) params.isSchoolStop = isSchoolStop === 'true';
            if (typeof page === 'string') params.page = parseInt(page, 10);
            if (typeof limit === 'string') params.limit = parseInt(limit, 10);
            if (typeof sort === 'string') params.sort = sort;

            const busStops = await busStopService.getAll(params);
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
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin của trạm dừng") {
                return res.status(400).json({ message: e.message });
            }
            console.error("Có lỗi xảy ra khi chỉnh sửa trạm dừng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error" + errorMessage });
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const busStop = await busStopService.edit(String(req.params.id), req.body);
            res.status(200).json(busStop);
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin của trạm dừng") {
                return res.status(400).json({ message: e.message });
            } else {
                console.error("Có lỗi xảy ra khi chỉnh sửa trạm dừng:", e);
                const errorMessage = e instanceof Error ? e.message : e;
                return res.status(500).json({ message: "Internal server error" + errorMessage });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const busStop = await busStopService.delete(String(req.params.id));
            res.status(200).json(busStop);
        } catch (e) {
            console.error("Có lỗi xảy ra khi xóa trạm dừng:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error" + errorMessage });
        }
    }
}

export const busStopController = new BusStopController();

