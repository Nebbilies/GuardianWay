import {Request, Response} from "express";
import {BusTripStatus} from "@prisma/client";
import {GetAllBusTripsParams} from "../repositories/busTrip.repository";
import {busTripService} from "../services/busTrip.service";

class BusTripController {
    async getAll(req: Request, res: Response) {
        const {search, status, routeId, busId, driverId, date, page, limit, sort} = req.query;
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
    }

    async create(req: Request, res: Response) {
        const trip = await busTripService.create(req.body);
        res.status(201).json(trip);
    }

    async edit(req: Request, res: Response) {
        const trip = await busTripService.update(String(req.params.id), req.body);
        res.status(200).json(trip);
    }

    async delete(req: Request, res: Response) {
        await busTripService.delete(String(req.params.id));
        res.status(200).json({message: "Xóa chuyến đi thành công"});
    }
}

export const busTripController = new BusTripController();
