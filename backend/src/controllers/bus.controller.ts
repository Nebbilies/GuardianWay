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
}

export const busController = new BusController();