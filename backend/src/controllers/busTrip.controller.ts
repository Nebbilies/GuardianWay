import {Request, Response} from "express";
import {BusTripStatus} from "@prisma/client";
import {GetAllBusTripsParams} from "../repositories/busTrip.repository";
import {busTripService} from "../services/busTrip.service";

class BusTripController {
    async getAll(req: Request, res: Response) {
        const {search, status, routeId, busId, driverId, date, page, limit, sort} = req.query;

        try {
            const params: GetAllBusTripsParams = {};

            if (typeof search === "string") params.search = search;
            if (typeof status === "string") params.status = status as BusTripStatus;
            if (typeof routeId === "string") params.routeId = routeId;
            if (typeof busId === "string") params.busId = busId;
            if (typeof driverId === "string") params.driverId = driverId;
            if (typeof date === "string") params.date = date;
            if (typeof page === "string") params.page = parseInt(page, 10);
            if (typeof limit === "string") params.limit = parseInt(limit, 10);
            if (typeof sort === "string") params.sort = sort;

            const trips = await busTripService.getAll(params);
            res.json(trips);
        } catch (e) {
            console.error("Có lỗi xảy ra khi lấy danh sách chuyến đi:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            res.status(500).json({message: "Internal server error: " + errorMessage});
        }
    }

    async create(req: Request, res: Response) {
        try {
            const trip = await busTripService.create(req.body);
            res.status(201).json(trip);
        } catch (e) {
            if (e instanceof Error && [
                "Thiếu thông tin chuyến đi",
                "Ngày chạy không hợp lệ",
                "Giờ bắt đầu không hợp lệ",
                "Giờ kết thúc không hợp lệ",
                "Giờ kết thúc phải sau giờ bắt đầu"
            ].includes(e.message)) {
                return res.status(400).json({message: e.message});
            }

            console.error("Có lỗi xảy ra khi tạo chuyến đi:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({message: "Internal server error: " + errorMessage});
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const trip = await busTripService.update(String(req.params.id), req.body);
            res.status(200).json(trip);
        } catch (e) {
            if (e instanceof Error && [
                "Thiếu thông tin chuyến đi",
                "Ngày chạy không hợp lệ",
                "Giờ bắt đầu không hợp lệ",
                "Giờ kết thúc không hợp lệ",
                "Giờ kết thúc phải sau giờ bắt đầu"
            ].includes(e.message)) {
                return res.status(400).json({message: e.message});
            }

            console.error("Có lỗi xảy ra khi chỉnh sửa chuyến đi:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({message: "Internal server error: " + errorMessage});
        }
    }

    async delete(req: Request, res: Response) {
        try {
            await busTripService.delete(String(req.params.id));
            res.status(200).json({message: "Xóa chuyến đi thành công"});
        } catch (e) {
            if (e instanceof Error && e.message === "Thiếu thông tin chuyến đi") {
                return res.status(400).json({message: e.message});
            }

            console.error("Có lỗi xảy ra khi xóa chuyến đi:", e);
            const errorMessage = e instanceof Error ? e.message : e;
            return res.status(500).json({message: "Internal server error: " + errorMessage});
        }
    }
}

export const busTripController = new BusTripController();
