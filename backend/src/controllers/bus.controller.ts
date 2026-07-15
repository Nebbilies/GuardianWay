import {Response} from "express";
import {GetAllBusesParams} from "../repositories/bus.repository";
import {BusStatus} from "@prisma/client";
import {busService} from "../services/bus.service";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {requireSchoolId, tenantScope} from "../utils/tenant";

class BusController {
    async getAll(req: AuthenticatedRequest, res: Response) {
        const {search, page, limit, sort, status} = req.query;
        const params: GetAllBusesParams = {schoolId: tenantScope(req)};

        if (typeof search === 'string') params.search = search;
        if (typeof page === 'string') params.page = parseInt(page, 1);
        if (typeof limit === 'string') params.limit = parseInt(limit, 10);
        if (typeof sort === 'string') params.sort = sort;
        if (typeof status === 'string') params.status = status as BusStatus;

        const buses = await busService.getAll(params);
        res.status(200).json(buses);
    }

    async create(req: AuthenticatedRequest, res: Response) {
        const bus = await busService.create(requireSchoolId(req), req.body);
        res.status(201).json(bus);

    }

    async edit(req: AuthenticatedRequest, res: Response) {
        const bus = await busService.update(String(req.params.id), requireSchoolId(req), req.body);
        res.status(200).json(bus);
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        const bus = await busService.delete(String(req.params.id), requireSchoolId(req));
        res.status(200).json(bus);
    }
}

export const busController = new BusController();