import {Request, Response} from "express";
import {GetAllBusesParams} from "../repositories/bus.repository";
import {BusStatus} from "@prisma/client";
import {busService} from "../services/bus.service";

class BusController {
    async getAll(req: Request, res: Response) {
        const { search, page, limit, sort, status } = req.query;
        try {
            const params: GetAllBusesParams = {};

            if (typeof search === 'string') params.search = search;
            if (typeof page === 'string') params.page = parseInt(page, 1);
            if (typeof limit === 'string') params.limit = parseInt(limit, 10);
            if (typeof sort === 'string') params.sort = sort;
            if (typeof status === 'string') params.status = status as BusStatus;

            const buses = await busService.getAll(params);
            res.json(buses);
        } catch (e) {
            console.error("Có lỗi xảy ra khi lấy danh sách xe buýt:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            res.status(500).json({ message: "Internal server error" + errorMessage });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const bus = await busService.create(req.body);
            res.status(201).json(bus);
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin của xe buýt") {
                return res.status(400).json({ message: e.message });
            }
            console.error("Có lỗi xảy ra khi tạo xe buýt:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({ message: "Internal server error" + errorMessage });
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const bus = await busService.update(String(req.params.id), req.body);
            res.status(200).json(bus);
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin của xe buýt") {
                return res.status(400).json({ message: e.message });
            } else if (e instanceof Error && e.message === "Thông tin của xe buýt không hợp lệ") {
                return res.status(400).json({ message: e.message });
            } else {
                console.error("Có lỗi xảy ra khi chỉnh sửa xe buýt:", e);
                const errorMessage = e instanceof Error ? e.message : e;
                return res.status(500).json({ message: "Internal server error" + errorMessage });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const bus = await busService.delete(String(req.params.id));
            res.status(200).json(bus);
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin của xe buýt") {
                return res.status(400).json({ message: e.message });
            } else {
                console.error("Có lỗi xảy ra khi xóa xe buýt:", e);
                const errorMessage = e instanceof Error ? e.message : e;
                return res.status(500).json({ message: "Internal server error" + errorMessage });
            }
        }
    }
}

export const busController = new BusController();