import {Response} from "express";
import {busStopService} from "../services/busStop.service";
import {GetAllBusStopsParams} from "../repositories/busStop.repository";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {requireSchoolId, tenantScope} from "../utils/tenant";

class BusStopController {
    async getAll(req: AuthenticatedRequest, res: Response) {
        const {search, isSchoolStop, page, limit, sort} = req.query;

        const params: GetAllBusStopsParams = {schoolId: tenantScope(req)};

        if (typeof search === 'string') params.search = search;
        if (isSchoolStop !== undefined) params.isSchoolStop = isSchoolStop === 'true';
        if (typeof page === 'string') params.page = parseInt(page, 10);
        if (typeof limit === 'string') params.limit = parseInt(limit, 10);
        if (typeof sort === 'string') params.sort = sort;

        const busStops = await busStopService.getAll(params);
        res.json(busStops);
    }

    async create(req: AuthenticatedRequest, res: Response) {
        const busStop = await busStopService.create(requireSchoolId(req), req.body);
        res.status(201).json(busStop);

    }

    async edit(req: AuthenticatedRequest, res: Response) {
        const busStop = await busStopService.edit(String(req.params.id), requireSchoolId(req), req.body);
        res.status(200).json(busStop);
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        const busStop = await busStopService.delete(String(req.params.id), requireSchoolId(req));
        res.status(200).json(busStop);
    }
}

export const busStopController = new BusStopController();

