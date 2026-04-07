import {Request, Response} from "express";
import {GetAllBusRoutesParams} from "../repositories/busRoute.repository";
import {busRouteService} from "../services/busRoute.service";

class BusRouteController {
    async getAll(req: Request, res: Response) {
        const { search, page, limit, sort } = req.query;
        try {
            const params: GetAllBusRoutesParams = {};

            if (typeof search === 'string') params.search = search;
            if (typeof page === 'string') params.page = parseInt(page, 1);
            if (typeof limit === 'string') params.limit = parseInt(limit, 10);
            if (typeof sort === 'string') params.sort = sort;

            const busRoutes = await busRouteService.getAll(params);
            res.json(busRoutes);
        } catch (e) {
            console.error("Có lỗi xảy ra khi lấy danh sách tuyến đường:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            res.status(500).json({ message: "Internal server error" + errorMessage });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const busRoute = await busRouteService.create(req.body);
            res.status(201).json(busRoute);
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin của tuyến đường") {
                return res.status(400).json({ message: e.message });
            }
            console.error("Có lỗi xảy ra khi tạo tuyến đường:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error" + errorMessage });
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const busRoute = await busRouteService.edit(String(req.params.id), req.body);
            res.status(200).json(busRoute);
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin của tuyến đường") {
                return res.status(400).json({ message: e.message });
            } else {
                console.error("Có lỗi xảy ra khi chỉnh sửa tuyến đường:", e);
                const errorMessage = e instanceof Error ? e.message : e;
                return res.status(500).json({ message: "Internal server error" + errorMessage });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const busRoute = await busRouteService.delete(String(req.params.id));
            res.status(200).json(busRoute);
        } catch (e) {
            console.error("Có lỗi xảy ra khi xóa tuyến đường:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error" + errorMessage });
        }
    }
}

export const busRouteController = new BusRouteController();