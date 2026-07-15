import {Response} from "express";
import {GetAllBusRoutesParams} from "../repositories/busRoute.repository";
import {busRouteService} from "../services/busRoute.service";
import {AuthenticatedRequest} from "../middlewares/auth.middleware";
import {requireSchoolId, tenantScope} from "../utils/tenant";

class BusRouteController {
    async getAll(req: AuthenticatedRequest, res: Response) {
        const {search, page, limit, sort} = req.query;
        const params: GetAllBusRoutesParams = {schoolId: tenantScope(req)};

        if (typeof search === 'string') params.search = search;
        if (typeof page === 'string') params.page = parseInt(page, 1);
        if (typeof limit === 'string') params.limit = parseInt(limit, 10);
        if (typeof sort === 'string') params.sort = sort;

        const busRoutes = await busRouteService.getAll(params);
        res.json(busRoutes);

    }

    async create(req: AuthenticatedRequest, res: Response) {
        const busRoute = await busRouteService.create(requireSchoolId(req), req.body);
        res.status(201).json(busRoute);
    }

    async edit(req: AuthenticatedRequest, res: Response) {
        const busRoute = await busRouteService.edit(String(req.params.id), requireSchoolId(req), req.body);
        res.status(200).json(busRoute);
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        const busRoute = await busRouteService.delete(String(req.params.id), requireSchoolId(req));
        res.status(200).json(busRoute);
    }
}

export const busRouteController = new BusRouteController();