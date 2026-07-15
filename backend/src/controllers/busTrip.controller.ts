import {Response} from "express";
import {BusTripStatus, TripType} from "@prisma/client";
import {GetAllBusTripsParams} from "../repositories/busTrip.repository";
import {busTripService} from "../services/busTrip.service";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {requireSchoolId, tenantScope} from "../utils/tenant";

class BusTripController {
    async getAll(req: AuthenticatedRequest, res: Response) {
        const {search, status, routeId, busId, driverId, tripType, date, page, limit, sort} = req.query;
        const params: GetAllBusTripsParams = {schoolId: tenantScope(req)};

        if (typeof search === "string") params.search = search;
        if (typeof status === "string") params.status = status as BusTripStatus;
        if (typeof routeId === "string") params.routeId = routeId;
        if (typeof busId === "string") params.busId = busId;
        if (typeof driverId === "string") params.driverId = driverId;
        if (typeof tripType === "string") params.tripType = tripType as TripType;
        if (typeof date === "string") params.date = date;
        if (typeof page === "string") params.page = parseInt(page, 10);
        if (typeof limit === "string") params.limit = parseInt(limit, 10);
        if (typeof sort === "string") params.sort = sort;

        const trips = await busTripService.getAll(params);
        res.json(trips);
    }

    async create(req: AuthenticatedRequest, res: Response) {
        const trip = await busTripService.create(requireSchoolId(req), req.body);
        res.status(201).json(trip);
    }

    async edit(req: AuthenticatedRequest, res: Response) {
        const trip = await busTripService.update(String(req.params.id), requireSchoolId(req), req.body);
        res.status(200).json(trip);
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        await busTripService.delete(String(req.params.id), requireSchoolId(req));
        res.status(200).json({message: "Xóa chuyến đi thành công"});
    }
}

export const busTripController = new BusTripController();
